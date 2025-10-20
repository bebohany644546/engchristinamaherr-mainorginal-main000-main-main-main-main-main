// اختبار تحويل أرقام الشهور إلى أسماء

const monthNames = [
  "الشهر الأول",
  "الشهر الثاني",
  "الشهر الثالث",
  "الشهر الرابع",
  "الشهر الخامس",
  "الشهر السادس",
  "الشهر السابع",
  "الشهر الثامن",
  "الشهر التاسع",
  "الشهر العاشر",
  "الشهر الحادي عشر",
  "الشهر الثاني عشر"
];

// اختبار 1: تحويل الشهر 1
const selectedMonths1 = [1, 2, 3];
const selectedMonthNames1 = selectedMonths1.map(monthNum => monthNames[monthNum - 1]);
console.log("Test 1 - Selected months:", selectedMonths1);
console.log("Test 1 - Month names:", selectedMonthNames1);

// اختبار 2: محاكاة بيانات الطالب
const studentPaidMonths = ["الشهر الأول", "الشهر الثالث", "الشهر الخامس"];
console.log("\nStudent paid months:", studentPaidMonths);

// اختبار 3: التحقق من عدم الدفع
const hasNotPaidSelectedMonths = selectedMonthNames1.some(monthName => 
  !studentPaidMonths.includes(monthName)
);
console.log("Has not paid selected months?", hasNotPaidSelectedMonths);
console.log("Reason: Student paid", studentPaidMonths, "but we're looking for", selectedMonthNames1);

// اختبار 4: طالب دفع كل الشهور المطلوبة
const studentPaidMonths2 = ["الشهر الأول", "الشهر الثاني", "الشهر الثالث"];
const hasNotPaidSelectedMonths2 = selectedMonthNames1.some(monthName => 
  !studentPaidMonths2.includes(monthName)
);
console.log("\nStudent 2 paid months:", studentPaidMonths2);
console.log("Has not paid selected months?", hasNotPaidSelectedMonths2);
console.log("Reason: Student paid all required months");