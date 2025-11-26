import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2', {
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    
    const data = await response.json();
    const countries = data
      .map((country: any) => ({
        value: country.cca2,
        label: country.name.common,
      }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
    
    return NextResponse.json({ success: true, data: countries });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
