const value = obj => {
  return "transformer" in obj ? obj.transformer(obj) : obj.value;
};

module.exports = {
  image: obj => {
    const val = value(obj);
    return '<img src="' + val + '" alt="' + val + '" />';
  },

  a: obj => {
    const val = value(obj);
    return '<a href="' + val + '" target="_blank">' + val + '</a>';
  },

  b: obj => {
    const val = value(obj);
    return '<b>' + val + '</b>';
  },

  i: obj => {
    const val = value(obj);
    return '<i>' + val + '</i>';
  },
};
