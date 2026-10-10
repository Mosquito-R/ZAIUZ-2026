const sendProblem = (res, status, title, detail, errors = []) => {
    return res
        .status(status)
        .type('application/problem+json')
        .json({
            type: 'about:blank',
            title,
            status,
            detail,
            instance: res.req?.originalUrl,
            ...(Array.isArray(errors) && errors.length > 0 && { errors })
        });
};

module.exports = { sendProblem };