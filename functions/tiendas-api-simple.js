exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      count: 20,
      message: "Simple tiendas function"
    })
  };
};
