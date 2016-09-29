//	TWIX
//	Twitter Image Extractor
//	1.0

/*
 * Pendientes:
 * 
 * Ordenar flujo de vistas y opciones posibles
 * Manejo de lista de usuario: CRUD
 * Manejo de imágenes por bajar y bajadas en dos listas, para no bajar duplicadas
 * Usar wget para bajar imágenes y sacarles el ":orig" del nombre
 * Correr automáticamente cada X horas/días
 */


//	Librerías
var Twit = require('twit');
var _ = require('underscore');
var readline = require('readline');
//var fs = require('fs');
var fs = require('graceful-fs');
var http = require('http');
var mkdirp = require('mkdirp');
var futures = require('futures');

//	Se necesita generar una app en twitter.com y poner acá los datos
var T = new Twit({
	consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
});

//	Pantallas
var pantallas = {
'bienvenida': `
============================
TWIX
Twitter Image Extractor

[1] Update Image List
[2] Download Images
[3] View User list
[4] Add User To List
============================

Chose an option:
`,
'user': `
`,
'list': `
`,
'search': `
`
}

//	Obtener imágenes de un usuario (funciona pero sólo a console log. Debería dejar una lista limpia en un archivo central)
function get(screen_name) {
	console.log('Loop. Limit: ' + limit);
	console.log('*');
	if ( limit == '' ) {
		var p = {'screen_name': screen_name, 'count': 200};
	} else {
		var p = {'screen_name': screen_name, 'count': 200, 'max_id': limit};
	}
	console.log(p);
	T.get('statuses/user_timeline', p,  function (err, data, response) {
		if ( err ) {
			console.log('ERROR');
			console.log(err);
		} else {
			console.log('> ' + data.length);
			_.each(data, function (tweet) {
				count_tweets++;
				if ( tweet.entities.media ) {
					_.each(tweet.entities.media, function(media) {
						if ( media.media_url.indexOf('_video_thumb') == -1 ) {
							var global_data = null;
							count_media++;
							//	Generar listado
							console.log(media.media_url+':orig');
							
							
							//	Bajar fotos
							/*
							file = "lists/" + media.media_url.replace('http://pbs.twimg.com/media/', '').toString();
							console.log("archivo: > " + file);
							if ( fs.exists( file ) ) {
								console.log('- ['+tweet.user.screen_name+'] '+media.media_url.replace('http://pbs.twimg.com/media/', ''));
							} else {
								console.log('+ ['+tweet.user.screen_name+'] '+media.media_url.replace('http://pbs.twimg.com/media/', ''));
								var file = fs.createWriteStream("lists/" + media.media_url.replace('http://pbs.twimg.com/media/', ''));
								var request = http.get(media.media_url + ":orig", function(response) {
									var stream = response.pipe(file);
									stream.on('finish', function () {
										console.log('Archivo bajado');
										latest = tweet.id;
										if ( latest != limit ) {
											limit = latest;
											console.log('bajando otro');
											get(screen_name);
										} else {
											console.log('Done!');
											console.log('Tweets scanned: ' + count_tweets);
											console.log('Images extracted: ' + count_media);
										}
									});
								});
							}
							//console.log(fs.access("lists/" + media.media_url.replace('http://pbs.twimg.com/media/', ''), fs.F_OK, function(){ console.log('oxo'); break; }))
							*/
							
							//console.log('ok');
						} else {
							//console.log('.');
						}
					});
				}
				latest = tweet.id;
			});
			if ( latest != limit ) {
					limit = latest;
					console.log('bajando otro');
					get(screen_name);
				} else {
					console.log('Done!');
					console.log('Tweets scanned: ' + count_tweets);
					console.log('Images extracted: ' + count_media);
				}
		}
	});
}

//	Obtener imágenes de una lista [1/3] (creo que no funciona)
function get_list(user, list, limit) {
	//	Obteniendo lista
	console.log('Obteniendo lista '+user+'/'+list);

	var options = {'owner_screen_name': user, 'slug': list};
	T.get('lists/members', options,  function (err, data, response) {

		if ( err ) {
			console.log('ERROR');
			console.log(err);

		} else {
			//console.log(data.users);
			console.log('Recibidos: ' + data.users.length + ' miembros');
			//console.log(data);
			_.each(data.users, function (user) {
				console.log('Bajando imágenes de '+user.screen_name);
				get(user.screen_name);
			});
		}
	});
}

//	Obtener imágenes de una lista [2/3] (creo que no funciona)
function get_list_asy(user, list, limit) {
	//	Obteniendo lista
	console.log('Obteniendo lista '+user+'/'+list);

	var options = {'owner_screen_name': user, 'slug': list};
	T.get('lists/members', options,  function (err, data, response) {

		if ( err ) {
			console.log('ERROR');
			console.log(err);

		} else {
			//console.log('>usuarios>');
			//console.log(data.users);
			//console.log('>usuarios>');
			//console.log('Recibidos: ' + data.users.length + ' miembros');
			//console.log('>usuarios>');
			//console.log(data);

		console.log('obteniendo lista');
			futures.forEachAsync(data.users, function (next, miembro, index) {
				listaa.push(miembro.screen_name);
				console.log('unito: '+miembro.screen_name);
				next;
			}).then(function () {
				// then after all of the elements have been handled
				// the final callback fires to let you know it's all done
				//console.log('bajados todos los miembros de la lista');
				console.log('bajando lista');
				get_from_list();
			});
/*
			futures.forEachAsync(data.users, function (next, miembro, index) {
				//console.log(miembro);
				console.log('Bajando imágenes de '+miembro.screen_name);
				get(miembro.screen_name);
			}).then(function () {
				// then after all of the elements have been handled
				// the final callback fires to let you know it's all done
				console.log('bajados todos los miembros de la lista');
				
				next();
			});
			* */
		}
	});
}

//	Bajar una lista de usuarios [3/3] (creo que no funciona)
function get_list_new(user, list) {

	var options = {'owner_screen_name': user, 'slug': list};
	T.get('lists/members', options,  function (err, data, response) {

		if ( err ) {
			console.log('ERROR');
			console.log(err);

		} else {

			var itemsProcessed = 0;

			function callback () { console.log('all done'); }

			data.users.forEach((item, index, array) => {
				get(item.screen_name, () => {
					itemsProcessed++;
					if(itemsProcessed === array.length) {
					callback();
					}
				});
			});
		}
	});
}

//	Revisar límite de peticiones de API
function check_limit_status() {
	T.get('application/rate_limit_status', function (err, data, response) {
		console.log('-----');
		console.log('Revisando estado de límites de API');
		if ( err ) {
			console.log('ERROR');
			console.log(err);

		} else {
			console.log('Lists/members:');
			console.log(data.resources.lists['/lists/members']);
			//console.log('Lists/members: ' + data.resources.users);
			console.log('Statuses/user_timeline:');
			console.log(data.resources.statuses['/statuses/user_timeline']);
		}
		console.log('-----');
		if ( data.resources.lists['/lists/members'] > 0 && data.resources.statuses['/statuses/user_timeline'] > 0 ) {
			return true;
		} else {
			return false;
		}
	});
}


//	 : :    main
//	        +  TWIX    +
//	- = - = = = TWIX = = = - = -
//	        +    TWIX  +
//	                program


//	Consola: Leer StdIn y generar pantalas/respuestas
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//	Variables para loops
var limit = '';
var count_tweets = 0;
var count_media = 0;

//	Programa
console.log('TWIX');
console.log('Twitter Image Extractor');


if ( process.argv[2] ) {

	//	Proceso manual con un nombre de usuario
	console.log('Manual mode');
	if ( process.argv[3] ) {
		console.log('Continuing extraction for user ' + process.argv[2] + ' from tweet ' + process.argv[3]);
		limit = process.argv[3];
		get(process.argv[2]);
	} else {
		console.log('Extracting images for user: ' + process.argv[2]);
		mkdirp(process.argv[2], function (err) {
			if (err) console.error(err)
			else console.log('Images will be stored in directory: ' + process.argv[2])
		});
		get(process.argv[2]);
	}
} else {

	//	Proceso interactivo con pantallas que reciben input
	rl.question(pantallas.bienvenida, (answer) => {
		if ( answer == '1' ) {
			rl.question('A bot needs a name: ', (a) => {
				mkdirp(a, function (err) {
					if (err) console.error(err)
					else console.log('Images will be stored in directory: ' + a)
				});
				get(a);
				rl.close();
			});
		} else if ( answer == '2' ) {
			rl.question('User name: ', (uname) => {
				rl.question('List name: ', (lname) => {
					get_list(uname, lname);
					rl.close();
				});
			});
		} else {
			console.log('Invalid option: ', answer);
		}
	});
}
