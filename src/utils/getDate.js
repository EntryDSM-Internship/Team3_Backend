const getMonth = () => {
  const month = new Date().getMonth() + 1;
  return month < 10 ? String(`0${month}`) : String(month);
}

const getDay = () => {
  const day = new Date().getDate();
  return day < 10 ? String(`0${day}`) : String(month);
}

module.exports = {getMonth, getDay};