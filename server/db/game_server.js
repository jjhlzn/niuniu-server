exports.makeServerUrl = () => {
  if (process.env.NODE_ENV == 'production') {
    return "http://niu.yhkamani.com:3001"; // "http://192.168.1.114:3001"; //"
    //return "http://192.168.1.114:3001";
  } else {
    //return "http://192.168.31.175:3001"; // "http://192.168.1.114:3001"; //"
    return "http://192.168.1.114:3001"; 
  }
}