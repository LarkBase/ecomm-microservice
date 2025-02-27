const logger = {
    auth: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    audit: { info: jest.fn() },
    errorLog: { error: jest.fn() },
  };
  
  module.exports = logger;
  