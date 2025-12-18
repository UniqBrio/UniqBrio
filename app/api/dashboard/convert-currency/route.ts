import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"
import CurrencyConversionLogModel from "@/models/CurrencyConversionLog"
import CurrencyHistoryModel from "@/models/CurrencyHistory"
import { getClientIp, getUserAgent } from "@/lib/audit-logger"

// Exchange rate API with multiple providers for reliability
async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  try {
    // Try primary API: exchangerate-api.com (free, no key required)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.rates && data.rates[to]) {
        console.log(`[Exchange Rate] ${from} to ${to}: ${data.rates[to]} (from exchangerate-api.com)`)
        return data.rates[to]
      }
    }
  } catch (error) {
    console.error("Primary exchange rate API failed:", error)
  }

  try {
    // Fallback API: frankfurter.app (free, no key required)
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)
    
    if (response.ok) {
      const data = await response.json()
      if (data.rates && data.rates[to]) {
        console.log(`[Exchange Rate] ${from} to ${to}: ${data.rates[to]} (from frankfurter.app)`)
        return data.rates[to]
      }
    }
  } catch (error) {
    console.error("Fallback exchange rate API failed:", error)
  }

  // If both APIs fail, return 1 (no conversion)
  console.warn(`[Exchange Rate] Could not fetch rate for ${from} to ${to}, using 1:1`)
  return 1
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Extract tenant ID from token
    const tenantId = decoded.tenantId || decoded.academyId || decoded.email
    const userId = decoded.userId || decoded.sub || decoded.email
    const userRole = decoded.role || 'user'

    const { fromCurrency, toCurrency } = await req.json()

    if (!fromCurrency || !toCurrency) {
      return NextResponse.json({ error: "Missing currency parameters" }, { status: 400 })
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({
        success: true,
        message: "No conversion needed - currencies are the same",
        exchangeRate: 1,
        fromCurrency,
        toCurrency,
      })
    }

    // Get client info for audit logging
    const ipAddress = getClientIp(req.headers)
    const userAgent = getUserAgent(req.headers)

    // Connect to MongoDB
    await dbConnect("uniqbrio")

    // Check for recent conversions (prevent multiple conversions)
    const recentConversion = await CurrencyConversionLogModel.findOne({
      tenantId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      status: 'SUCCESS'
    }).sort({ timestamp: -1 })

    if (recentConversion) {
      return NextResponse.json(
        {
          error: "A currency conversion was already performed in the last 24 hours",
          lastConversion: {
            fromCurrency: recentConversion.fromCurrency,
            toCurrency: recentConversion.toCurrency,
            timestamp: recentConversion.timestamp,
            convertedBy: recentConversion.convertedBy,
          },
          message: "Please wait 24 hours between conversions or contact support if you need to perform another conversion."
        },
        { status: 429 }
      )
    }

    // Get exchange rate from live API
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency)
    console.log(`[Currency Conversion] Rate from ${fromCurrency} to ${toCurrency}:`, exchangeRate)

    // Use generic schemas for flexible querying (we need strict: false for dynamic fields)
    const courseSchema = new mongoose.Schema({}, { collection: 'courses', strict: false })
    const Course = mongoose.models.CourseForCurrencyConversion || 
      mongoose.model('CourseForCurrencyConversion', courseSchema)

    const paymentSchema = new mongoose.Schema({}, { collection: 'payments', strict: false })
    const Payment = mongoose.models.PaymentForCurrencyConversion || 
      mongoose.model('PaymentForCurrencyConversion', paymentSchema)

    const productSchema = new mongoose.Schema({}, { collection: 'products', strict: false })
    const Product = mongoose.models.ProductForCurrencyConversion || 
      mongoose.model('ProductForCurrencyConversion', productSchema)

    const monthlySubscriptionSchema = new mongoose.Schema({}, { collection: 'monthlysubscriptions', strict: false })
    const MonthlySubscription = mongoose.models.MonthlySubscriptionForCurrencyConversion || 
      mongoose.model('MonthlySubscriptionForCurrencyConversion', monthlySubscriptionSchema)

    const scheduleSchema = new mongoose.Schema({}, { collection: 'schedules', strict: false })
    const Schedule = mongoose.models.ScheduleForCurrencyConversion || 
      mongoose.model('ScheduleForCurrencyConversion', scheduleSchema)

    const notificationSchema = new mongoose.Schema({}, { collection: 'notifications', strict: false })
    const Notification = mongoose.models.NotificationForCurrencyConversion || 
      mongoose.model('NotificationForCurrencyConversion', notificationSchema)

    const incomeSchema = new mongoose.Schema({}, { collection: 'incomes', strict: false })
    const Income = mongoose.models.IncomeForCurrencyConversion || 
      mongoose.model('IncomeForCurrencyConversion', incomeSchema)

    const expenseSchema = new mongoose.Schema({}, { collection: 'expenses', strict: false })
    const Expense = mongoose.models.ExpenseForCurrencyConversion || 
      mongoose.model('ExpenseForCurrencyConversion', expenseSchema)

    // Start MongoDB transaction
    const mongoSession = await mongoose.startSession()
    mongoSession.startTransaction()

    try {
      // Create conversion log entry
      const conversionLog = await CurrencyConversionLogModel.create([{
        tenantId,
        fromCurrency,
        toCurrency,
        exchangeRate,
        convertedBy: decoded.email,
        convertedById: userId,
        role: userRole,
        ipAddress,
        userAgent,
        status: 'PARTIAL', // Will update to SUCCESS at the end
        statistics: {
          coursesUpdated: 0,
          paymentsUpdated: 0,
          productsUpdated: 0,
          subscriptionsUpdated: 0,
          schedulesUpdated: 0,
          notificationsUpdated: 0,
          incomesUpdated: 0,
          expensesUpdated: 0,
          totalRecordsUpdated: 0,
        },
      }], { session: mongoSession })

      const conversionId = conversionLog[0]._id

      let coursesUpdated = 0
      let paymentsUpdated = 0
      let productsUpdated = 0
      let subscriptionsUpdated = 0
      let schedulesUpdated = 0
      let notificationsUpdated = 0
      let incomesUpdated = 0
      let expensesUpdated = 0

      // Update all course prices with tenant isolation
      const courses = await Course.find({ 
        $or: [{ tenantId }, { academyId: tenantId }],
        price: { $exists: true, $gt: 0 } 
      }).session(mongoSession)
      
      for (const course of courses) {
        // Backup original values
        const originalValues = { price: course.price }
        const newPrice = Math.round(course.price * exchangeRate)
        const convertedValues = { price: newPrice }

        await Course.updateOne(
          { _id: course._id },
          { $set: { price: newPrice } },
          { session: mongoSession }
        )

        // Save to history for rollback capability
        await CurrencyHistoryModel.create([{
          tenantId,
          conversionId,
          entityType: 'Course',
          entityId: course._id,
          originalValues,
          convertedValues,
          fromCurrency,
          toCurrency,
          exchangeRate,
        }], { session: mongoSession })

        coursesUpdated++
      }
      console.log(`[Currency Conversion] Updated ${coursesUpdated} courses`)

      // Update payment records (courseFee, outstanding amounts, etc.)
      const payments = await Payment.find({
        $or: [{ tenantId }, { academyId: tenantId }],
        $and: [
          {
            $or: [
              { courseFee: { $exists: true, $gt: 0 } },
              { outstandingAmount: { $exists: true, $gt: 0 } },
              { receivedAmount: { $exists: true, $gt: 0 } }
            ]
          }
        ]
      }).session(mongoSession)
      
      for (const payment of payments) {
        const originalValues: any = {}
        const updates: any = {}
        
        if (payment.courseFee && payment.courseFee > 0) {
          originalValues.courseFee = payment.courseFee
          updates.courseFee = Math.round(payment.courseFee * exchangeRate)
        }
        if (payment.courseRegistrationFee && payment.courseRegistrationFee > 0) {
          originalValues.courseRegistrationFee = payment.courseRegistrationFee
          updates.courseRegistrationFee = Math.round(payment.courseRegistrationFee * exchangeRate)
        }
        if (payment.studentRegistrationFee && payment.studentRegistrationFee > 0) {
          originalValues.studentRegistrationFee = payment.studentRegistrationFee
          updates.studentRegistrationFee = Math.round(payment.studentRegistrationFee * exchangeRate)
        }
        if (payment.outstandingAmount && payment.outstandingAmount > 0) {
          originalValues.outstandingAmount = payment.outstandingAmount
          updates.outstandingAmount = Math.round(payment.outstandingAmount * exchangeRate)
        }
        if (payment.receivedAmount && payment.receivedAmount > 0) {
          originalValues.receivedAmount = payment.receivedAmount
          updates.receivedAmount = Math.round(payment.receivedAmount * exchangeRate)
        }
        
        if (Object.keys(updates).length > 0) {
          await Payment.updateOne(
            { _id: payment._id }, 
            { $set: updates },
            { session: mongoSession }
          )

          await CurrencyHistoryModel.create([{
            tenantId,
            conversionId,
            entityType: 'Payment',
            entityId: payment._id,
            originalValues,
            convertedValues: updates,
            fromCurrency,
            toCurrency,
            exchangeRate,
          }], { session: mongoSession })

          paymentsUpdated++
        }
      }
      console.log(`[Currency Conversion] Updated ${paymentsUpdated} payment records`)

      // Update product prices
      const products = await Product.find({ 
        $or: [{ tenantId }, { academyId: tenantId }],
        price: { $exists: true, $gt: 0 } 
      }).session(mongoSession)
      
      for (const product of products) {
        const originalValues = { price: product.price }
        const newPrice = Math.round(product.price * exchangeRate)
        const convertedValues = { price: newPrice }

        await Product.updateOne(
          { _id: product._id },
          { $set: { price: newPrice } },
          { session: mongoSession }
        )

        await CurrencyHistoryModel.create([{
          tenantId,
          conversionId,
          entityType: 'Product',
          entityId: product._id,
          originalValues,
          convertedValues,
          fromCurrency,
          toCurrency,
          exchangeRate,
        }], { session: mongoSession })

        productsUpdated++
      }
      console.log(`[Currency Conversion] Updated ${productsUpdated} products`)

      // Update monthly subscription prices
      const subscriptions = await MonthlySubscription.find({
        $or: [{ tenantId }, { academyId: tenantId }],
        $and: [
          {
            $or: [
              { courseFee: { $exists: true, $gt: 0 } },
              { registrationFee: { $exists: true, $gt: 0 } },
              { originalMonthlyAmount: { $exists: true, $gt: 0 } },
              { discountedMonthlyAmount: { $exists: true, $gt: 0 } },
              { totalPaidAmount: { $exists: true, $gt: 0 } },
              { totalExpectedAmount: { $exists: true, $gt: 0 } },
              { remainingAmount: { $exists: true, $gt: 0 } }
            ]
          }
        ]
      }).session(mongoSession)
      
      for (const subscription of subscriptions) {
        const originalValues: any = {}
        const updates: any = {}
        
        if (subscription.courseFee && subscription.courseFee > 0) {
          originalValues.courseFee = subscription.courseFee
          updates.courseFee = Math.round(subscription.courseFee * exchangeRate)
        }
        if (subscription.registrationFee && subscription.registrationFee > 0) {
          originalValues.registrationFee = subscription.registrationFee
          updates.registrationFee = Math.round(subscription.registrationFee * exchangeRate)
        }
        if (subscription.originalMonthlyAmount && subscription.originalMonthlyAmount > 0) {
          originalValues.originalMonthlyAmount = subscription.originalMonthlyAmount
          updates.originalMonthlyAmount = Math.round(subscription.originalMonthlyAmount * exchangeRate)
        }
        if (subscription.discountedMonthlyAmount && subscription.discountedMonthlyAmount > 0) {
          originalValues.discountedMonthlyAmount = subscription.discountedMonthlyAmount
          updates.discountedMonthlyAmount = Math.round(subscription.discountedMonthlyAmount * exchangeRate)
        }
        if (subscription.totalPaidAmount && subscription.totalPaidAmount > 0) {
          originalValues.totalPaidAmount = subscription.totalPaidAmount
          updates.totalPaidAmount = Math.round(subscription.totalPaidAmount * exchangeRate)
        }
        if (subscription.totalExpectedAmount && subscription.totalExpectedAmount > 0) {
          originalValues.totalExpectedAmount = subscription.totalExpectedAmount
          updates.totalExpectedAmount = Math.round(subscription.totalExpectedAmount * exchangeRate)
        }
        if (subscription.remainingAmount && subscription.remainingAmount > 0) {
          originalValues.remainingAmount = subscription.remainingAmount
          updates.remainingAmount = Math.round(subscription.remainingAmount * exchangeRate)
        }
        
        if (Object.keys(updates).length > 0) {
          await MonthlySubscription.updateOne(
            { _id: subscription._id }, 
            { $set: updates },
            { session: mongoSession }
          )

          await CurrencyHistoryModel.create([{
            tenantId,
            conversionId,
            entityType: 'MonthlySubscription',
            entityId: subscription._id,
            originalValues,
            convertedValues: updates,
            fromCurrency,
            toCurrency,
            exchangeRate,
          }], { session: mongoSession })

          subscriptionsUpdated++
        }
      }
      console.log(`[Currency Conversion] Updated ${subscriptionsUpdated} monthly subscriptions`)

      // Update schedule/session prices
      const schedules = await Schedule.find({ 
        $or: [{ tenantId }, { academyId: tenantId }],
        price: { $exists: true, $gt: 0 } 
      }).session(mongoSession)
      
      for (const schedule of schedules) {
        const originalValues = { price: schedule.price }
        const newPrice = Math.round(schedule.price * exchangeRate)
        const convertedValues = { price: newPrice }

        await Schedule.updateOne(
          { _id: schedule._id },
          { $set: { price: newPrice } },
          { session: mongoSession }
        )

        await CurrencyHistoryModel.create([{
          tenantId,
          conversionId,
          entityType: 'Schedule',
          entityId: schedule._id,
          originalValues,
          convertedValues,
          fromCurrency,
          toCurrency,
          exchangeRate,
        }], { session: mongoSession })

        schedulesUpdated++
      }
      console.log(`[Currency Conversion] Updated ${schedulesUpdated} schedules`)

      // Update notification amounts (payment reminders, etc.)
      const notifications = await Notification.find({
        $or: [{ tenantId }, { academyId: tenantId }],
        $and: [
          {
            $or: [
              { 'metadata.amount': { $exists: true, $gt: 0 } },
              { 'metadata.dueAmount': { $exists: true, $gt: 0 } }
            ]
          }
        ]
      }).session(mongoSession)
      
      for (const notification of notifications) {
        const originalValues: any = {}
        const updates: any = {}
        
        if (notification.metadata?.amount && notification.metadata.amount > 0) {
          originalValues['metadata.amount'] = notification.metadata.amount
          updates['metadata.amount'] = Math.round(notification.metadata.amount * exchangeRate)
        }
        if (notification.metadata?.dueAmount && notification.metadata.dueAmount > 0) {
          originalValues['metadata.dueAmount'] = notification.metadata.dueAmount
          updates['metadata.dueAmount'] = Math.round(notification.metadata.dueAmount * exchangeRate)
        }
        
        if (Object.keys(updates).length > 0) {
          await Notification.updateOne(
            { _id: notification._id }, 
            { $set: updates },
            { session: mongoSession }
          )

          await CurrencyHistoryModel.create([{
            tenantId,
            conversionId,
            entityType: 'Notification',
            entityId: notification._id,
            originalValues,
            convertedValues: updates,
            fromCurrency,
            toCurrency,
            exchangeRate,
          }], { session: mongoSession })

          notificationsUpdated++
        }
      }
      console.log(`[Currency Conversion] Updated ${notificationsUpdated} notifications`)

      // Update income records (all amount fields)
      const incomes = await Income.find({
        $or: [{ tenantId }, { academyId: tenantId }],
        $and: [
          {
            $or: [
              { amount: { $exists: true, $gt: 0 } },
              { totalAmount: { $exists: true, $gt: 0 } }
            ]
          }
        ]
      }).session(mongoSession)
      
      for (const income of incomes) {
        const originalValues: any = {}
        const updates: any = {}
        
        if (income.amount && income.amount > 0) {
          originalValues.amount = income.amount
          updates.amount = Math.round(income.amount * exchangeRate)
        }
        if (income.totalAmount && income.totalAmount > 0) {
          originalValues.totalAmount = income.totalAmount
          updates.totalAmount = Math.round(income.totalAmount * exchangeRate)
        }
        
        if (Object.keys(updates).length > 0) {
          await Income.updateOne(
            { _id: income._id }, 
            { $set: updates },
            { session: mongoSession }
          )

          await CurrencyHistoryModel.create([{
            tenantId,
            conversionId,
            entityType: 'Income',
            entityId: income._id,
            originalValues,
            convertedValues: updates,
            fromCurrency,
            toCurrency,
            exchangeRate,
          }], { session: mongoSession })

          incomesUpdated++
        }
      }
      console.log(`[Currency Conversion] Updated ${incomesUpdated} income records`)

      // Update expense records (all amount fields)
      const expenses = await Expense.find({
        $or: [{ tenantId }, { academyId: tenantId }],
        $and: [
          {
            $or: [
              { amount: { $exists: true, $gt: 0 } },
              { totalAmount: { $exists: true, $gt: 0 } }
            ]
          }
        ]
      }).session(mongoSession)
      
      for (const expense of expenses) {
        const originalValues: any = {}
        const updates: any = {}
        
        if (expense.amount && expense.amount > 0) {
          originalValues.amount = expense.amount
          updates.amount = Math.round(expense.amount * exchangeRate)
        }
        if (expense.totalAmount && expense.totalAmount > 0) {
          originalValues.totalAmount = expense.totalAmount
          updates.totalAmount = Math.round(expense.totalAmount * exchangeRate)
        }
        
        if (Object.keys(updates).length > 0) {
          await Expense.updateOne(
            { _id: expense._id }, 
            { $set: updates },
            { session: mongoSession }
          )

          await CurrencyHistoryModel.create([{
            tenantId,
            conversionId,
            entityType: 'Expense',
            entityId: expense._id,
            originalValues,
            convertedValues: updates,
            fromCurrency,
            toCurrency,
            exchangeRate,
          }], { session: mongoSession })

          expensesUpdated++
        }
      }
      console.log(`[Currency Conversion] Updated ${expensesUpdated} expense records`)

      // Update the conversion log with final statistics and SUCCESS status
      const statistics = {
        coursesUpdated,
        paymentsUpdated,
        productsUpdated,
        subscriptionsUpdated,
        schedulesUpdated,
        notificationsUpdated,
        incomesUpdated,
        expensesUpdated,
        totalRecordsUpdated: coursesUpdated + paymentsUpdated + productsUpdated + 
          subscriptionsUpdated + schedulesUpdated + notificationsUpdated + 
          incomesUpdated + expensesUpdated
      }

      await CurrencyConversionLogModel.updateOne(
        { _id: conversionId },
        { 
          $set: { 
            status: 'SUCCESS',
            statistics
          } 
        },
        { session: mongoSession }
      )

      // Commit transaction
      await mongoSession.commitTransaction()
      console.log('[Currency Conversion] Transaction committed successfully')

      return NextResponse.json({
        success: true,
        message: "Currency conversion completed successfully",
        exchangeRate,
        fromCurrency,
        toCurrency,
        statistics
      })
    } catch (error) {
      // Rollback transaction on error
      await mongoSession.abortTransaction()
      console.error("[Currency Conversion] Transaction aborted:", error)

      // Log failed conversion
      try {
        await CurrencyConversionLogModel.create({
          tenantId,
          fromCurrency,
          toCurrency,
          exchangeRate,
          convertedBy: decoded.email,
          convertedById: userId,
          role: userRole,
          ipAddress,
          userAgent,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          statistics: {
            coursesUpdated: 0,
            paymentsUpdated: 0,
            productsUpdated: 0,
            subscriptionsUpdated: 0,
            schedulesUpdated: 0,
            notificationsUpdated: 0,
            incomesUpdated: 0,
            expensesUpdated: 0,
            totalRecordsUpdated: 0,
          },
        })
      } catch (logError) {
        console.error("[Currency Conversion] Failed to log error:", logError)
      }

      return NextResponse.json(
        { 
          error: "Failed to convert currency",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      )
    } finally {
      mongoSession.endSession()
    }
  } catch (error) {
    console.error("[Currency Conversion] Error:", error)
    return NextResponse.json(
      { 
        error: "Failed to convert currency",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
