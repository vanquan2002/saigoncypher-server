const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ message: "Mã sản phẩm không hợp lệ!" });
  }

  if (err.code === 11000) {
    const duplicateValue = Object.values(err.keyValue)[0];

    return res.status(400).json({
      message: `Email \"${duplicateValue}\" đã tồn tại. Vui lòng thử email khác!`,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };
