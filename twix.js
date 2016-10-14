//	TWIX
//	Twitter Image Extractor
//	1.0

//	TWIX is a Twittter image extractor and list manager.
//	It is made by Rodrigo Lanas.
//	rodrigo@contraculto.com
//	http://contraculto.com/twix

//	THIS IS WORKING SOFTWARE, BUT IN AN UNFINISHED STATE


//	Libraries
var fs = require('fs');
var Twit = require('twit');
var _ = require('underscore');
var readline = require('readline');
var http = require('http');
var request = require("request");

//	THIS IS WHERE YOU NEED TO PUT YOUR TWITTER APP INFORMATION
var T = new Twit({
  consumer_key: '',
  consumer_secret: '',
  access_token: '',
  access_token_secret: ''
});

//	Get list of images for user
function get(screen_name) {
	download_count = 0;
	current = screen_name;

	if ( limit == '' ) {
		var p = {'screen_name': screen_name, 'count': 200};
	} else {
		var p = {'screen_name': screen_name, 'count': 200, 'max_id': limit};
	}

	T.get('statuses/user_timeline', p, function (err, data, response) {
		if ( err ) {
			console.log('Error getting tweets for user');
			fail(err.code, getcallback);
		} else {
			if ( newest_check == 0 ) {
				newest_check_s = fs.readFileSync('ultimas-imagenes', 'utf-8');
				newest_check_a = newest_check_s.split('\n');
				_.every(newest_check_a, function(line) {
					arr = line.split('|');
					arr = _.filter(arr, function(n){ return n != undefined });
					if ( arr[0] != "" && arr[0].toLowerCase() == screen_name.toLowerCase() ) {
						newest_check = arr[1];
						return false;
					} else {
						return true;
					}
				});
			}

			if ( typeof data[0] != 'undefined' ) {
				if ( newest_check <= data[0].id) {
					dc = 0;
					_.each(data, function (tweet) {
						count_tweets++;
						if ( tweet.entities.media ) {
							_.each(tweet.entities.media, function(media) {
								if ( media.media_url.indexOf('_video_thumb') == -1 ) {
									var global_data = null;
									if ( newest_check == 0 ) {
										first = data[0].user.screen_name + '|' + data[0].id;
										newfile_a = _.filter(newest_check_a, function(item) {
											item_a = item.split('|');
											if ( item_a[0].toLowerCase() == screen_name.toLowerCase() ) {
												return false;
											} else {
												return true;
											}
										});
										newfile_s = newfile_a.join('\n');
										newfile_s += "\n" + first;
										fs.writeFileSync('ultimas-imagenes', newfile_s);
										newest_check = 1;
									} else {
									}
									if ( pendientes.indexOf(media.media_url) < 0 ) {
										count_media++;
										dc++;
										fs.appendFileSync('imagenes-pendientes', media.media_url + "\n");
									} else {
									}
								}
							});
						}
						latest = tweet.id;
					});
					if ( latest != limit ) {
						limit = latest;
						console.log('+ ' + dc);
						get(screen_name);
					} else {
						console.log('+ ' + dc);
						limit = '';
						getcallback();
					}
				} else {
					console.log('Tweets for user up to date.');
					getcallback();
				}
			} else {
				console.log('No more tweets received for user.');
				getcallback();
			} 
		}
	});
}

//	Callback for GET function. Used for error-proof looping
var getcallback = function() {
	curr++;
	if ( typeof arrobas_a[curr] != 'undefined' ) {
		inform('Next user: @' + arrobas_a[curr]);
		newest_check = 0;
		limit = '';
		get(arrobas_a[curr]);
	} else {
		inform('Image list updated\nTweets read: ' + count_tweets + '.\nNew images: ' + count_media + '.');
		rl.question("Continue...", (answer) => {
			menu_principal();
		});
	}
}

//	Get list of images for users in "arrobas" file
function get_new_images() {
	inform('Updating image list');
	arrobas_s = fs.readFileSync('arrobas', 'utf-8');
	arrobas_a = arrobas_s.split('\n');
	max = arrobas_a.length;
	if ( arrobas_a[curr] != 'undefined' ) {
		inform('First user: @' + arrobas_a[curr]);
		get(arrobas_a[curr]);
	}
}

//	Download an image
function down(img) {
	bajadas = fs.readFileSync('imagenes-bajadas', 'utf-8');
	if ( bajadas.indexOf(img) <= 0 && typeof img != 'undefined' && img != 'undefined' ) {
		url = img + ':orig';
		filename = img.replace('http://pbs.twimg.com/media/', '').trim();
		var localStream = fs.createWriteStream('imagenes/'+filename);

		var out = request({ uri: url });
		out.on('response', function (resp) {
    		if (resp.statusCode === 200) {
        		out.pipe(localStream);
        		localStream.on('close', function () {
        			fs.appendFileSync('imagenes-bajadas', img + "\n");
        			console.log('Image downloaded: ' + filename);
        			total_users_imported++;
            		down_callback();
        		});
    		} else {
	        	fail(666);
			}
		});

	} else {
		down_callback();
	}
}

//	Callback for DOWN function
function down_callback() {
	download_current++;
	if ( download_current <= download_max ) {
		down(pendientes_a[download_current]);
	} else {
		total_saved = download_current + 1;
		inform('All images downloaded!\nTotal images saved: ' + total_saved);
		rl.question("Continue...", (answer) => {
			menu_principal();
		});
	}
}

//	Download images from 'imagenes-pendientes' file
function download_images() {
	bajadas_s = fs.readFileSync('imagenes-bajadas', 'utf-8');
	bajadas_a = bajadas_s.split('\n');
	download_max = pendientes_a.length;
	console.log('Total images to download: ' + download_max)
	down(pendientes_a[download_current]);
}

//	Import usernames from twitter list
function import_twitter_list(user, list, limit) {
	console.log('Importing list '+user+'/'+list);
	var total_users_imported = 0;
	var options = {'owner_screen_name': user, 'slug': list};
	T.get('lists/members', options,  function (err, data, response) {

		if ( err ) {
			fail('An error occurred during list import: ' + err);

		} else {
			
			_.each(data.users, function (user) {
				add_user(user.screen_name, 'silent');
			});
			inform("List imported\nTotal users added: " + total_users_imported);
			rl.question("Continue...", (answer) => {
				menu_principal();
			});
		}
	});
}

//	Error handling
function fail(type, callback) {
	//	API Request Limit
	if ( type == 88 ) {
		wait = (7);
		inform('We have hit API Request limit!\nWaiting for ' + wait + ' minutes...');
		setTimeout(function() {
			console.log('Resuming...');
			get_new_images();
		}, wait * 60 * 1000);
	//	Twitter is over capacity
	} else if ( type == '130' ) {
		console.log('over capacity!');
		get_new_images();
	//	Custom for file downloading
	} else if ( type == '666' ) {
		console.log("Image download didn't work");
		down_callback();
	//	Generic error. Accepts callback
	} else {
		inform('Unknown Error: ' + type);
		if ( typeof callback != 'undefined' ) {
			callback();
		} else {
			menu_principal();
		}
	}
}

//	Show a message
function inform(message) {
	console.log("\n----------------------------------------\n" + message + "\n----------------------------------------\n");
}

//	Show list of user names
function show_user_list() {
	arrobas_s = fs.readFileSync('arrobas', 'utf-8');
	console.log(arrobas_s);
	var arrobas_a = arrobas_s.split('\n');
	inform("User count: " + arrobas_a.length + ".");
	rl.question("Continue...", (answer) => {
		menu_principal();
	});
}

//	Add user name to list 
function add_user(screen_name, silent) {
	arrobas_s = fs.readFileSync('arrobas', 'utf-8');
	if ( arrobas_s.indexOf(screen_name) < 0){
		console.log('Usuario aregado: @' + screen_name + '.');
		fs.appendFileSync('arrobas', "\n" + screen_name);
		if ( typeof silent == 'undefined' ) {
			rl.question("Continue...", (answer) => {
				menu_principal();
			});
		}
	} else {
		console.log('Usuario ya está en la lista, no agregado.');
		if ( typeof silent == 'undefined' ) {
			rl.question("Continue...", (answer) => {
				menu_principal();
			});
		}
	}
}

//	Show main menu
function menu_principal() {
menu = `

========================================
TWIX
Twitter Image Extractor

[1] Update Image List
[2] Download Images
[3] View User list
[4] Add User To List
[5] Import users from Twitter List
[6] About TWIX
[7] Exit to DOS
========================================

Choose an option: `;

	rl.question(menu, (answer) => {
		if ( answer == '1' ) {
			inform("Refreshing image list for all users");
			get_new_images();
		} else if ( answer == '2' ) {
			download_images();
		} else if ( answer == '3' ) {
			inform("This is the current list of users");
			show_user_list()
		} else if ( answer == '4' ) {
			rl.question("Enter username: ", (uname) => {
				add_user(uname);
			});
		} else if ( answer == '5' ) {
			rl.question("Enter the list owner's username: ", (uname) => {
				list_user = uname;
				rl.question("Enter the list's slug: ", (slug) => {
					list_slug = slug;
					import_twitter_list(list_user, list_slug);
				});
			});
		} else if ( answer == '6' ) {
			inform("TWIX is a Twittter image extractor and list manager.\nIt is made by Rodrigo Lanas.\nrodrigo@contraculto.com\nhttp://contraculto.com\nhttps://github.com/contraculto/twix");
			rl.question("Continue...", (answer) => {
				menu_principal();
			});
		} else if ( answer == '7' ) {
			inform("Good bye!\nThank you for preferring TWIX, a product of CONTRACULTO INDUSTRIES!\nFor love and knowledge, pushing into the light of future!\nhttp://contraculto.com/twix");
			rl.close();
		} else {
			inform('Invalid option: "' + answer + '".');
			rl.question("Continue...", (answer) => {
				menu_principal();
			});
		}
	});
}

//	 : :    main
//	        +  TWIX    +
//	- = - = = = TWIX = = = - = -
//	        +    TWIX  +
//	                program


//	Use console for input/output

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//	Variables

var arrobas = [];
var current = '';
var limit = '';
var count_tweets = 0;
var count_media = 0;
var curr = 0;

var list_user = '';
var list_slug = '';

var newest_check = 0;

var pendientes = fs.readFileSync('imagenes-pendientes', 'utf-8');
var pendientes_a = pendientes.split('\n');
var pendientes_new = pendientes;

var download_max = 0;
var download_current = 0;

var total_users_imported = 0;

//	Run TWIX!

console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
menu_principal();