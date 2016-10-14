# Twix
Twitter Image Extractor

TWIX is a Twittter image extractor and list manager made with JavaScript, Node and some modules. It allows you to keep a text file of twitter user names, add to it and import from twitter lists. Then you can download the list of images posted by those users and then download the images. It uses text files in order to not do unnecessary request or download duplicate images.

To install and run you need to:

* Copy all files to a directory
* Go to [apps.twitter.com](https://apps.twitter.com/) and create a new app
* Copy your consumer key, consumer secret, access token, and access token secret to the appropriate place in file `twix.js` (lines 22 to 25)
* Run `npm install`
* Finally run the program with `node twix.js`
