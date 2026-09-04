const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/counsel', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const Case = mongoose.connection.collection('cases');
    const cases = await Case.find({}).toArray();
    console.log("Number of cases:", cases.length);
    if (cases.length > 0) {
      const c = cases[0];
      console.log("Case ID:", c._id);
      console.log("hearingDates_enc:", c.hearingDates_enc);
      console.log("caseUpdates_enc:", c.caseUpdates_enc);
    }
    process.exit(0);
  });
