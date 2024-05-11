export const sendSuccess = (res, data, message) => {
  let Response;
  if (Array.isArray(data)) {
    if (data.length === 0) {
      Response = {
        status: 201,
        data: {
          count: data.length,
          rows: data,
        },
        message,
      };
      /* Send Back An HTTP Response */
      res.status(201).json(Response);
      return res.end();
    }
    Response = {
      status: 200,

      data: {
        count: data.length,
        rows: data,
      },
      message,
    };
  } else if (typeof data === "string" && !message) {
    Response = {
      status: 200,
      data: {},
      message: data,
    };
  } else {
    Response = { status: 200, data, message };
  }
  /* Send Back An HTTP Response */
  res.status(200).json(Response);
  res.end();
};

export const sendSuccessCount = (res, count, limit, data, message) => {
  let Response;
  if (Array.isArray(data)) {
    if (data.length === 0) {
      Response = {
        status: 201,
        total_data: count,
        total_page: Math.ceil(count / limit),
        data: {
          count: data.length,
          rows: data,
        },
        message,
      };
      /* Send Back An HTTP Response */
      res.status(201).json(Response);
      return res.end();
    }
    Response = {
      status: 200,
      total_data: count,
      total_page: Math.ceil(count / limit),
      data: {
        count: data.length,
        rows: data,
      },
      message,
    };
  } else if (typeof data === "string" && !message) {
    Response = {
      status: 200,
      total_data: count,
      total_page: Math.ceil(count / limit),
      data: {},
      message: data,
    };
  } else {
    Response = {
      status: 200,
      total_data: count,
      total_page: Math.ceil(count / limit),
      data,
      message,
    };
  }
  /* Send Back An HTTP Response */
  res.status(200).json(Response);
  res.end();
};
export const sendSuccessWith200 = (res, data, date = Date.now()) => {
  const Response = { status: 200, data, date };
  /* Send Back An HTTP Response */
  res.status(200).json(Response);
  res.end();
};

export const sendBadRequest = (res, messages) => {
  res.status(400).send({
    status: 400,
    message: messages,
  });
};

export const sendBadRequestWith202 = (res, messages) => {
  res.status(202).send({
    status: 202,
    message: messages,
  });
};

export const sendBadRequestWith401Code = (res, messages) => {
  res.status(401).send({
    status: 401,
    message: messages,
  });
};

export const sendBadRequestWith406Code = (res, messages) => {
  res.status(406).send({
    status: 406,
    message: messages,
  });
};

export const sendBadRequestWith405Code = (res, messages) => {
  res.status(405).send({
    status: 405,
    message: messages,
  });
};

export const sendBadRequestWith407Code = (res, messages) => {
  res.status(407).send({
    status: 407,
    message: messages,
  });
};

export const sendError = (res, errors, message) => {
  res.status(400).send({
    message,
    status: 400,
    errors,
  });
};
