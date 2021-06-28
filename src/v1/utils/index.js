const crypto = require('crypto')

function uuid() {
  const uuid = (
    // @ts-ignore
    [1e7] + // 10000000
    -1e3 +  // -1000
    -4e3 +  // -4000
    -8e3 +  // -8000
    -1e11   // -100000000000
  )
    .replace(/[018]/g, (c) =>
      // Replace zeroes, ones, and eights with random number
      (c ^ (crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16)
    );
  return uuid;
}

function patchingData(oldData, newData) {
  let keys = Object.keys(newData);
  let result = {};
  keys.forEach((key) => {
    if (oldData[key] != newData[key]) {
      result[key] = newData[key];
    }
  });
  return result;
};



module.exports = { uuid, patchingData }