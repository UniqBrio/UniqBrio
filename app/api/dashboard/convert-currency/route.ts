import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { dbConnect } from "@/lib/mongodb"
import mongoose from "mongoose"

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

    // Get exchange rate from live API
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency)
    console.log(`[Currency Conversion] Rate from ${fromCurrency} to ${toCurrency}:`, exchangeRate)

    // Connect to MongoDB
    await dbConnect("uniqbrio")

    // Define Course schema for currency conversion
    const courseSchema = new mongoose.Schema({}, { 
      collection: 'courses',
      strict: false 
    })
    const Course = mongoose.models.CourseForCurrencyConversion || 
      mongoose.model('CourseForCurrencyConversion', courseSchema)

    // Define Payment schema
    const paymentSchema = new mongoose.Schema({}, { 
      collection: 'payments',
      strict: false 
    })
    const Payment = mongoose.models.PaymentForCurrencyConversion || 
      mongoose.model('PaymentForCurrencyConversion', paymentSchema)

    // Define Product schema (for sell products)
    const productSchema = new mongoose.Schema({}, { 
      collection: 'products',
      strict: false 
    })
    const Product = mongoose.models.ProductForCurrencyConversion || 
      mongoose.model('ProductForCurrencyConversion', productSchema)

    // Define MonthlySubscription schema
    const monthlySubscriptionSchema = new mongoose.Schema({}, { 
      collection: 'monthlysubscriptions',
      strict: false 
    })
    const MonthlySubscription = mongoose.models.MonthlySubscriptionForCurrencyConversion || 
      mongoose.model('MonthlySubscriptionForCurrencyConversion', monthlySubscriptionSchema)

    // Define Schedule schema (for session prices)
    const scheduleSchema = new mongoose.Schema({}, { 
      collection: 'schedules',
      strict: false 
    })
    const Schedule = mongoose.models.ScheduleForCurrencyConversion || 
      mongoose.model('ScheduleForCurrencyConversion', scheduleSchema)

    // Define Notification schema (for payment notifications)
    const notificationSchema = new mongoose.Schema({}, { 
      collection: 'notifications',
      strict: false 
    })
    const Notification = mongoose.models.NotificationForCurrencyConversion || 
      mongoose.model('NotificationForCurrencyConversion', notificationSchema)

    // Define Income schema (for financial management)
    const incomeSchema = new mongoose.Schema({}, { 
      collection: 'incomes',
      strict: false 
    })
    const Income = mongoose.models.IncomeForCurrencyConversion || 
      mongoose.model('IncomeForCurrencyConversion', incomeSchema)

    // Define Expense schema (for financial management)
    const expenseSchema = new mongoose.Schema({}, { 
      collection: 'expenses',
      strict: false 
    })
    const Expense = mongoose.models.ExpenseForCurrencyConversion || 
      mongoose.model('ExpenseForCurrencyConversion', expenseSchema)

    let coursesUpdated = 0
    let paymentsUpdated = 0
    let productsUpdated = 0
    let subscriptionsUpdated = 0
    let schedulesUpdated = 0
    let notificationsUpdated = 0
    let incomesUpdated = 0
    let expensesUpdated = 0

    // Update all course prices
    const courses = await Course.find({ priceINR: { $exists: true, $gt: 0 } })
    for (const course of courses) {
      const newPrice = Math.round(course.priceINR * exchangeRate)
      await Course.updateOne(
        { _id: course._id },
        { $set: { priceINR: newPrice } }
      )
      coursesUpdated++
    }
    console.log(`[Currency Conversion] Updated ${coursesUpdated} courses`)

    // Update payment records (courseFee, outstanding amounts, etc.)
    const payments = await Payment.find({
      $or: [
        { courseFee: { $exists: true, $gt: 0 } },
        { outstandingAmount: { $exists: true, $gt: 0 } },
        { receivedAmount: { $exists: true, $gt: 0 } }
      ]
    })
    
    for (const payment of payments) {
      const updates: any = {}
      
      if (payment.courseFee && payment.courseFee > 0) {
        updates.courseFee = Math.round(payment.courseFee * exchangeRate)
      }
      if (payment.courseRegistrationFee && payment.courseRegistrationFee > 0) {
        updates.courseRegistrationFee = Math.round(payment.courseRegistrationFee * exchangeRate)
      }
      if (payment.studentRegistrationFee && payment.studentRegistrationFee > 0) {
        updates.studentRegistrationFee = Math.round(payment.studentRegistrationFee * exchangeRate)
      }
      if (payment.outstandingAmount && payment.outstandingAmount > 0) {
        updates.outstandingAmount = Math.round(payment.outstandingAmount * exchangeRate)
      }
      if (payment.receivedAmount && payment.receivedAmount > 0) {
        updates.receivedAmount = Math.round(payment.receivedAmount * exchangeRate)
      }
      
      if (Object.keys(updates).length > 0) {
        await Payment.updateOne({ _id: payment._id }, { $set: updates })
        paymentsUpdated++
      }
    }
    console.log(`[Currency Conversion] Updated ${paymentsUpdated} payment records`)

    // Update product prices
    const products = await Product.find({ price: { $exists: true, $gt: 0 } })
    for (const product of products) {
      const newPrice = Math.round(product.price * exchangeRate)
      await Product.updateOne(
        { _id: product._id },
        { $set: { price: newPrice } }
      )
      productsUpdated++
    }
    console.log(`[Currency Conversion] Updated ${productsUpdated} products`)

    // Update monthly subscription prices
    const subscriptions = await MonthlySubscription.find({
      $or: [
        { courseFee: { $exists: true, $gt: 0 } },
        { registrationFee: { $exists: true, $gt: 0 } },
        { originalMonthlyAmount: { $exists: true, $gt: 0 } },
        { discountedMonthlyAmount: { $exists: true, $gt: 0 } },
        { totalPaidAmount: { $exists: true, $gt: 0 } },
        { totalExpectedAmount: { $exists: true, $gt: 0 } },
        { remainingAmount: { $exists: true, $gt: 0 } }
      ]
    })
    
    for (const subscription of subscriptions) {
      const updates: any = {}
      
      if (subscription.courseFee && subscription.courseFee > 0) {
        updates.courseFee = Math.round(subscription.courseFee * exchangeRate)
      }
      if (subscription.registrationFee && subscription.registrationFee > 0) {
        updates.registrationFee = Math.round(subscription.registrationFee * exchangeRate)
      }
      if (subscription.originalMonthlyAmount && subscription.originalMonthlyAmount > 0) {
        updates.originalMonthlyAmount = Math.round(subscription.originalMonthlyAmount * exchangeRate)
      }
      if (subscription.discountedMonthlyAmount && subscription.discountedMonthlyAmount > 0) {
        updates.discountedMonthlyAmount = Math.round(subscription.discountedMonthlyAmount * exchangeRate)
      }
      if (subscription.totalPaidAmount && subscription.totalPaidAmount > 0) {
        updates.totalPaidAmount = Math.round(subscription.totalPaidAmount * exchangeRate)
      }
      if (subscription.totalExpectedAmount && subscription.totalExpectedAmount > 0) {
        updates.totalExpectedAmount = Math.round(subscription.totalExpectedAmount * exchangeRate)
      }
      if (subscription.remainingAmount && subscription.remainingAmount > 0) {
        updates.remainingAmount = Math.round(subscription.remainingAmount * exchangeRate)
      }
      
      if (Object.keys(updates).length > 0) {
        await MonthlySubscription.updateOne({ _id: subscription._id }, { $set: updates })
        subscriptionsUpdated++
      }
    }
    console.log(`[Currency Conversion] Updated ${subscriptionsUpdated} monthly subscriptions`)

    // Update schedule/session prices
    const schedules = await Schedule.find({ price: { $exists: true, $gt: 0 } })
    for (const schedule of schedules) {
      const newPrice = Math.round(schedule.price * exchangeRate)
      await Schedule.updateOne(
        { _id: schedule._id },
        { $set: { price: newPrice } }
      )
      schedulesUpdated++
    }
    console.log(`[Currency Conversion] Updated ${schedulesUpdated} schedules`)

    // Update notification amounts (payment reminders, etc.)
    const notifications = await Notification.find({
      $or: [
        { 'metadata.amount': { $exists: true, $gt: 0 } },
        { 'metadata.dueAmount': { $exists: true, $gt: 0 } }
      ]
    })
    
    for (const notification of notifications) {
      const updates: any = {}
      
      if (notification.metadata?.amount && notification.metadata.amount > 0) {
        updates['metadata.amount'] = Math.round(notification.metadata.amount * exchangeRate)
      }
      if (notification.metadata?.dueAmount && notification.metadata.dueAmount > 0) {
        updates['metadata.dueAmount'] = Math.round(notification.metadata.dueAmount * exchangeRate)
      }
      
      if (Object.keys(updates).length > 0) {
        await Notification.updateOne({ _id: notification._id }, { $set: updates })
        notificationsUpdated++
      }
    }
    console.log(`[Currency Conversion] Updated ${notificationsUpdated} notifications`)

    // Update income records (all amount fields)
    const incomes = await Income.find({
      $or: [
        { amount: { $exists: true, $gt: 0 } },
        { totalAmount: { $exists: true, $gt: 0 } }
      ]
    })
    
    for (const income of incomes) {
      const updates: any = {}
      
      if (income.amount && income.amount > 0) {
        updates.amount = Math.round(income.amount * exchangeRate)
      }
      if (income.totalAmount && income.totalAmount > 0) {
        updates.totalAmount = Math.round(income.totalAmount * exchangeRate)
      }
      
      if (Object.keys(updates).length > 0) {
        await Income.updateOne({ _id: income._id }, { $set: updates })
        incomesUpdated++
      }
    }
    console.log(`[Currency Conversion] Updated ${incomesUpdated} income records`)

    // Update expense records (all amount fields)
    const expenses = await Expense.find({
      $or: [
        { amount: { $exists: true, $gt: 0 } },
        { totalAmount: { $exists: true, $gt: 0 } }
      ]
    })
    
    for (const expense of expenses) {
      const updates: any = {}
      
      if (expense.amount && expense.amount > 0) {
        updates.amount = Math.round(expense.amount * exchangeRate)
      }
      if (expense.totalAmount && expense.totalAmount > 0) {
        updates.totalAmount = Math.round(expense.totalAmount * exchangeRate)
      }
      
      if (Object.keys(updates).length > 0) {
        await Expense.updateOne({ _id: expense._id }, { $set: updates })
        expensesUpdated++
      }
    }
    console.log(`[Currency Conversion] Updated ${expensesUpdated} expense records`)

    return NextResponse.json({
      success: true,
      message: "Currency conversion completed successfully",
      exchangeRate,
      fromCurrency,
      toCurrency,
      statistics: {
        coursesUpdated,
        paymentsUpdated,
        productsUpdated,
        subscriptionsUpdated,
        schedulesUpdated,
        notificationsUpdated,
        incomesUpdated,
        expensesUpdated,
        totalRecordsUpdated: coursesUpdated + paymentsUpdated + productsUpdated + subscriptionsUpdated + schedulesUpdated + notificationsUpdated + incomesUpdated + expensesUpdated
      }
    })
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
