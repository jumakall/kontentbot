const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

module.exports = {
  formatDate: input => {
    const date = new Date(input);
    return monthName[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  },

  removeFromStart: (str, remove) => {
    const pos = str.indexOf(remove);
    if (pos >= 0)
      str = str.substring(pos + remove.length, str.length);
    return str;
  },

  removeFromEnd: (str, remove) => {
    const pos = str.lastIndexOf(remove);
    if (pos >= 0)
      str = str.substring(0, pos);
    return str;
  },
};