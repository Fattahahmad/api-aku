import ClientError from '../exceptions/ClientError.js';

const errorHandler = (err, req, res, next) => {
  // Jika error berasal dari custom class kita (ClientError dan turunannya)
  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
  }

  console.error('Server Error:', err.message); 
  
  return res.status(500).json({
    status: 'error',
    message: 'Maaf, terjadi kegagalan pada server kami.',
  });
};

export default errorHandler;