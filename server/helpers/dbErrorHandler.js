
const eRespCodes = {
  // unique item exists
  11000: (err) => {
    const kv = Object.entries(err.errorResponse.keyValue)[0];
    return kv;
  },
  11001: (err) => {
    console.log("ERROR 11001", err); // todo: db logging.
  }
};

//Todo: handle the other cases
const handleUserSaveError = async (err) => {
  if (err.errors) {
    // got an object instead of args
    if (Object.entries(err.errors)[0][1]['value']) {
      const value = Object.entries(err.errors)[0][1]['value'];
      return value;
    };
  };

  if (err.errorResponse) {
    if (err.errorResponse.code)
      return eRespCodes[err.errorResponse.code]
        ? eRespCodes[err.errorResponse.code](err)
        : console.log("Unknown error response code during user save..", err.errorResponse.code);
  };
};

export { handleUserSaveError };
