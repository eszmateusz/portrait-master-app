const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const textPattern = new RegExp(/(\w|\s|\.)*/, 'g');
    const emailPattern = new RegExp('^[a-zA-Z0-9][a-zA-Z0-9_.-]+@[a-zA-Z0-9][a-zA-Z0-9_.-]+\.{1,3}[a-zA-Z]{2,4}');

    const titleMatched = title.match(textPattern).join('');
    const authorMatched = author.match(textPattern).join('');
    const emailMatched = email.match(emailPattern).join('');

    if (
      (emailMatched.length < email.length)
      && (titleMatched.length < title.length)
      && (authorMatched.length < author.length)
    ) {
      throw new Error('Invalid characters, try again.')
    };

    if (
      (titleMatched.length == title.length)
      && (authorMatched.length == author.length)
      && (emailMatched.length == email.length)
      && file
    ) {// if fields are not empty
      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      if (
        (fileExt === 'jpg' || 'jpeg' || 'png' || 'gif')
        && title.length <= 25
        && author.length <= 50) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else res.json('Let\'s try again...');
    } else {
      throw new Error('Wrong input!');
    }

  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (!photoToUpdate) {
      res.status(404).json({ message: 'Not found...' });
    }

    const updatedPhoto = () => {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'Ok!' });
    }

    const clientIp = requestIp.getClientIp(req);
    const findUser = await Voter.findOne({ user: clientIp });

    if (findUser) {
      const votesArray = findUser.votes.filter(el => el == req.params.id);

      if (votesArray < 1) {
        findUser.votes.push(req.params.id);
        await Voter.updateOne( { user: clientIp }, { $set: { votes: findedUser.votes } } );
        updatedPhoto();
      } else {
        res.status(500).json('You cannot vote twice or more for the same photo.');
      }
    } else {
      const newVoter = await Voter({ user: clientIp, votes: req.params.id });
      await newVoter.save();
      updatedPhoto();
    }
  } 
  catch (err) {
    res.status(500).json(err);
  }

};