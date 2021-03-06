exports.makeServerUrl = () => {
  if (process.env.NODE_ENV == 'production') {

    let servers = [
      'http://niu.hengdianworld.com/socket.io/',
      //'http://blog.jinjunhang.com:3001/socket.io/'
    ];

    let index = Math.floor(Math.random() * 10000) % 2;

    return servers[index]; // "http://192.168.1.114:3001"; //"
    //return "http://192.168.1.114:3001";
  } else if (process.env.NODE_ENV == 'test') {
    //return "http://192.168.31.175:3001/socket.io/"; // "http://192.168.1.114:3001"; //"
    //return "http://192.168.1.117:3001"; 
	  return "http://testniu.hengdianworld.com/socket.io/";
  } else {
    return "http://localhost:3001/socket.io/";
  }
} 