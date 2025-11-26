export const getAge = (year, monthIndex, day) => {
  // monthIndex should be 0-based (0 = Jan)
  const today = new Date();
  const dob = new Date(year, monthIndex, day);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};
