import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { IncomeModel, ExpenseModel } from '@/lib/dashboard/models';
import { processBulkDropdownValues } from '@/lib/dashboard/dropdown-utils';
import crypto from 'crypto';

function bad(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

function getModel(name: string | null) {
  if (!name) return null;
  const key = name.toLowerCase();
  if (['income','incomes'].includes(key)) return IncomeModel;
  if (['expense','expenses'].includes(key)) return ExpenseModel;
  return null;
}

interface RowStatus {
  index: number; // original index in submitted batch
  status: 'inserted' | 'updated' | 'duplicate' | 'invalid' | 'error';
  id?: string;
  message?: string;
}

function makeHash(doc: any, collection: string) {
  // Key fields: date (yyyy-mm-dd), category (incomeCategory|expenseCategory), amount
  const dateKey = doc.date ? new Date(doc.date).toISOString().slice(0,10) : '';
  const category = collection.startsWith('income') ? (doc.incomeCategory||'') : (doc.expenseCategory||'');
  const amt = doc.amount ?? '';
  return crypto.createHash('sha1').update(`${collection}|${dateKey}|${category}|${amt}`).digest('hex');
}

function validate(doc: any, collection: string): string | null {
  if (!doc.date) return 'Missing date';
  if (isNaN(new Date(doc.date).getTime())) return 'Invalid date';
  if (doc.amount == null || isNaN(Number(doc.amount))) return 'Invalid amount';
  if (collection.startsWith('income')) {
    if (!doc.incomeCategory) return 'Missing incomeCategory';
    if (!doc.addToAccount) return 'Missing addToAccount';
  } else {
    if (!doc.expenseCategory) return 'Missing expenseCategory';
    if (!doc.addFromAccount) return 'Missing addFromAccount';
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect("uniqbrio");
    const body = await req.json();
    const { collection, items } = body || {};
    if (!collection) return bad('Missing collection');
    if (!Array.isArray(items) || items.length === 0) return bad('No items provided');
    const Model = getModel(collection);
    if (!Model) return bad('Invalid collection');

    // Preprocess & validate
    const prepped: any[] = [];
    const rowStatus: RowStatus[] = [];
    items.forEach((raw: any, idx: number) => {
      const doc: any = { ...raw };
      if (doc.date) doc.date = new Date(doc.date);
      if (doc.amount != null) doc.amount = Number(doc.amount) || 0;
      const err = validate(doc, collection.toLowerCase());
      if (err) {
        rowStatus.push({ index: idx, status: 'invalid', message: err });
      } else {
        doc.__hash = makeHash(doc, collection.toLowerCase());
        prepped.push({ doc, idx });
      }
    });

    // Fetch existing hashes to avoid duplicates
    const hashes = prepped.map(p => p.doc.__hash);
    const existing = await Model.find({ __hash: { $in: hashes } }, { __hash: 1 }).lean();
    const existingSet = new Set(existing.map((e: any) => e.__hash));

    const toInsert = prepped.filter(p => !existingSet.has(p.doc.__hash));
    // Perform bulk insert
    let inserted: any[] = [];
    if (toInsert.length) {
      try {
        inserted = await Model.insertMany(toInsert.map(t => t.doc), { ordered: false });
        
        // Auto-add dropdown values from successfully inserted records
        const insertedDocs = inserted.map(doc => doc.toObject?.() || doc);
        if (collection.toLowerCase().startsWith('income')) {
          await processBulkDropdownValues(insertedDocs, 'income');
        } else if (collection.toLowerCase().startsWith('expense')) {
          await processBulkDropdownValues(insertedDocs, 'expense');
        }
      } catch (insertErr: any) {
        console.warn('Partial insert error', insertErr?.message);
        // Continue; inserted may contain partial successes if driver returns them (not always)
      }
    }

    // Map inserted by hash for quick lookup
    const insertedByHash: Record<string, any> = {};
    inserted.forEach(d => { insertedByHash[d.__hash] = d; });

    // Compose row status results
    prepped.forEach(p => {
      if (existingSet.has(p.doc.__hash)) {
        rowStatus.push({ index: p.idx, status: 'duplicate', message: 'Duplicate skipped' });
      } else if (insertedByHash[p.doc.__hash]) {
        rowStatus.push({ index: p.idx, status: 'inserted', id: insertedByHash[p.doc.__hash]._id });
      } else {
        rowStatus.push({ index: p.idx, status: 'error', message: 'Unknown insertion failure' });
      }
    });

    // Return inserted items (only successes) + row status summary
    const successItems = inserted.map(d => ({ ...d.toObject?.() || d }));
    return NextResponse.json({
      insertedCount: successItems.length,
      total: items.length,
      successItems,
      rowStatus,
    });
  } catch (e: any) {
    console.error('Bulk import error', e);
    return bad(e.message || 'Bulk import failed', 500);
  }
}

export const revalidate = 0;