import React from 'react'
import { FormattedDateInput } from './formatted-date-input'

/**
 * Example usage of the FormattedDateInput component
 */
export function ExampleUsage() {
  const [dob, setDob] = React.useState("")         // ISO like "2025-09-04"
  const [joinDate, setJoinDate] = React.useState("")

  return (
    <div className="grid gap-4 md:grid-cols-2 p-4">
      <FormattedDateInput
        id="joiningDate"
        label="Joining Date"
        value={joinDate}
        onChange={setJoinDate}
        required
        displayFormat="dd-MMM-yyyy"
        placeholder="dd-mmm-yyyy"
        // error={submitted && !joinDate} // opt-in error state if needed
      />

      <FormattedDateInput
        id="dob"
        label="Date of Birth"
        value={dob}
        onChange={setDob}
        required
        displayFormat="dd-MMM-yyyy"
        placeholder="dd-mmm-yyyy"
      />
    </div>
  )
}
