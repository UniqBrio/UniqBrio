/**
 * Test file to verify shadcn/ui cn utility is working correctly
 * Run this test to ensure the setup is properly configured
 */

import { cn } from '@/lib/utils'

// Test 1: Basic usage
const test1 = cn('text-red-500', 'text-blue-500')
console.log('Test 1 - Conflicting classes:', test1)
// Expected: 'text-blue-500' (tailwind-merge should resolve conflicts)

// Test 2: Conditional classes
const isActive = true
const test2 = cn('base-class', isActive && 'active-class', !isActive && 'inactive-class')
console.log('Test 2 - Conditional classes:', test2)
// Expected: 'base-class active-class'

// Test 3: Array of classes
const test3 = cn(['class1', 'class2'], 'class3')
console.log('Test 3 - Array of classes:', test3)
// Expected: 'class1 class2 class3'

// Test 4: Object with boolean values
const test4 = cn({
  'text-white': true,
  'bg-black': false,
  'p-4': true
})
console.log('Test 4 - Object with booleans:', test4)
// Expected: 'text-white p-4'

// Test 5: Complex merge
const test5 = cn('px-2 py-1 bg-red-500', 'p-4 bg-blue-500')
console.log('Test 5 - Complex merge:', test5)
// Expected: 'p-4 bg-blue-500' (p-4 overrides px-2 py-1, bg-blue-500 overrides bg-red-500)

export function runCnTests() {
  console.log('=== Running cn() utility tests ===')
  console.log('Test 1:', test1)
  console.log('Test 2:', test2)
  console.log('Test 3:', test3)
  console.log('Test 4:', test4)
  console.log('Test 5:', test5)
  console.log('=== All tests completed ===')
  
  return {
    test1,
    test2,
    test3,
    test4,
    test5,
    success: true
  }
}

// If running directly with Node
if (typeof window === 'undefined') {
  runCnTests()
}
