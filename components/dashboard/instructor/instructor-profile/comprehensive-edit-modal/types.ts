export interface EditFormData {
  avatar: string;
  firstName: string;
  middleName: string;
  lastName: string;
  role: string;
  roleOther: string; // added (used when role === 'custom')
  email: string;
  phone: string; // local number portion (without country code)
  phoneCountryCode?: string; // dialing code (e.g., +1)
  maritalStatus: string;
  dob: string;
  joiningDate: string;
  contractType: string;
  contractTypeOther: string; // added (used when contractType === 'custom')
  jobLevel: string;
  jobLevelOther: string;
  gender: string;
  genderOther: string;
  address: string;
  country: string;
  state: string;
  yearsOfExperience: string;
  paymentInfo: {
    classCount: string;
    frequency: string;
    hourlyRate: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    branchAddress: string;
    paymentType: string;
    rate: string;
    overtimeRate: string;
    deductions: string;
    taxId: string;
    paymentMethod: string;
    payrollEmail: string;
    payrollPhone: string;
    idProof: File | null;
    rateType: string;
    upiProvider?: string;
    upiId?: string;
  };
}
