const fs = require('fs');
const file = 'prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

// 1. Update User model
content = content.replace(
  '  shifts              Shift[]\n\n  @@map("users")\n}',
  '  shifts              Shift[]\n  insuranceProfile    InsuranceProfile?\n  employmentRecord    EmploymentRecord?\n  leaveBalances       LeaveBalance[]\n  payslips            Payslip[]\n  documents           EmployeeDocument[]\n\n  @@map("users")\n}'
);

// 2. Update Location model
content = content.replace(
  '  shifts                          Shift[]\n\n  @@map("locations")\n}',
  '  shifts                          Shift[]\n  payrollPeriods                  PayrollPeriod[]\n\n  @@map("locations")\n}'
);

// 3. Update StaffAttendance model
content = content.replace(
  '  correctionRequests AttendanceCorrectionRequest[]\n\n  @@map("staff_attendance")\n}',
  '  correctionRequests AttendanceCorrectionRequest[]\n  anomalies          AttendanceAnomaly[]\n\n  @@map("staff_attendance")\n}'
);

// 4. Append new models to the end
const newModels = `
// -----------------------------------------------------------------------------
// HR & PAYROLL MODULE
// -----------------------------------------------------------------------------

model PayrollPeriod {
  id          String         @id @default(cuid())
  locationId  String
  startDate   DateTime       @db.Date
  endDate     DateTime       @db.Date
  name        String         // e.g., "2025-06"
  status      PayrollStatus  @default(DRAFT)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  payslips    Payslip[]
  location    Location       @relation(fields: [locationId], references: [id])

  @@map("payroll_periods")
}

enum PayrollStatus {
  DRAFT
  PUBLISHED
  PAID
}

model Payslip {
  id              String          @id @default(cuid())
  payrollPeriodId String
  userId          String
  baseSalary      Float
  totalOvertime   Float
  totalAllowances Float
  totalDeductions Float
  netPay          Float
  status          PayslipStatus   @default(DRAFT)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  payrollPeriod   PayrollPeriod   @relation(fields: [payrollPeriodId], references: [id], onDelete: Cascade)
  user            User            @relation(fields: [userId], references: [id])
  items           PayslipItem[]

  @@map("payslips")
}

enum PayslipStatus {
  DRAFT
  PUBLISHED
  PAID
}

model PayslipItem {
  id        String          @id @default(cuid())
  payslipId String
  name      String
  type      PayslipItemType
  amount    Float
  payslip   Payslip         @relation(fields: [payslipId], references: [id], onDelete: Cascade)

  @@map("payslip_items")
}

enum PayslipItemType {
  ALLOWANCE
  DEDUCTION
  OVERTIME
  BASE_PAY
}

model InsuranceProfile {
  id                     String   @id @default(cuid())
  userId                 String   @unique
  laborInsuranceBracket  Float
  healthInsuranceBracket Float
  pensionEmployer        Float    @default(6.0)
  pensionEmployee        Float    @default(0.0)
  dependents             Int      @default(0)
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("insurance_profiles")
}

model EmploymentRecord {
  id                String           @id @default(cuid())
  userId            String           @unique
  hireDate          DateTime         @db.Date
  terminationDate   DateTime?        @db.Date
  status            EmploymentStatus @default(ACTIVE)
  bankName          String?
  bankBranch        String?
  bankAccountNumber String?
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("employment_records")
}

enum EmploymentStatus {
  ACTIVE
  SUSPENDED
  TERMINATED
}

model LeaveBalance {
  id           String    @id @default(cuid())
  userId       String
  leaveType    LeaveType
  year         Int
  totalDays    Float     @default(0)
  usedDays     Float     @default(0)
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, leaveType, year])
  @@map("leave_balances")
}

model AttendanceAnomaly {
  id             String          @id @default(cuid())
  attendanceId   String
  type           AnomalyType
  severity       String?         // MINOR, MAJOR
  description    String?
  resolved       Boolean         @default(false)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  attendance     StaffAttendance @relation(fields: [attendanceId], references: [id], onDelete: Cascade)

  @@map("attendance_anomalies")
}

enum AnomalyType {
  LATE
  EARLY_LEAVE
  ABSENT
  MISSED_PUNCH
}

model EmployeeDocument {
  id             String          @id @default(cuid())
  userId         String
  type           DocumentType
  fileUrl        String
  expiryDate     DateTime?       @db.Date
  status         DocumentStatus  @default(VALID)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("employee_documents")
}

enum DocumentType {
  ID_CARD
  BANK_BOOK
  HEALTH_CERTIFICATE
  CONTRACT
  OTHER
}

enum DocumentStatus {
  VALID
  EXPIRED
  REJECTED
}
`;

content += '\n' + newModels;
fs.writeFileSync(file, content, 'utf8');
console.log('schema patched!');
