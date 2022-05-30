function isShallowEqual(v, o) {
  var k1 = Object.keys(v);
  var k2 = Object.keys(o);
  if (k1.length !== k2.length) {
    return false;
  }
  for (var i = 0; i < k1.length; i++) {
    if (o[k1[i]] !== v[k2[i]]) {
      return false;
    }
  }
  return true;
}

export default isShallowEqual;
