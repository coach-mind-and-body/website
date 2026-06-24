const express = require('express');
const app = express();
app.get('*', (req, res) => {
  res.status(200).send('Hello from Express on Railway!');
});
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => console.log('Express listening on port ' + port));
