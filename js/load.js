/* global WP_API_Settings */
(function( window, undefined ) {

	'use strict';

	/**
	 * Initialize the wp-api, optionally passing the API root.
	 *
	 * @param {string} apiRoot The api root. Optional, defaults to WP_API_Settings.root.
	 */
	wp.api.init = function( apiRoot, versionString ) {
		wp.api.utils.log( 'Starting up wp-api.' );

		apiRoot       = apiRoot || WP_API_Settings.root;
		versionString = versionString || 'wp/v2/';

		wp.api.utils.log( 'Loading schema from WP_API_Settings.root - ' + apiRoot + versionString );

		/**
		 * Construct and fetch the API schema.
		 */
		wp.api.utils.log( 'Building out schema');

		var schema = new wp.api.models.Schema(),
			schemaRoot = apiRoot.replace( wp.api.utils.getRootUrl(), '' );

		schema.fetch( {
			success: function( model ) {
				wp.api.utils.log( 'Schema loaded, processing.' );
				/**
				 * Iterate thru the routes, picking up models and collections to build.
				 */
				var modelRoutes = [], collectionRoutes = [];
				_.each( model.get( 'routes' ), function( route, index ) {
					// Skip the schema root if included in the schema
					if ( index !== versionString && index !== schemaRoot && index !== ( '/' + versionString.slice( 0, -1 ) ) ) {
						// Single item models end with an id or slug
						if ( index.endsWith( '+)' ) ) {
							modelRoutes.push( { index: index, route: route } );
						} else {
							// Collections contain a number or slug inside their route
							collectionRoutes.push( { index: index, route: route } );
						}
					}
				} );

				wp.api.utils.log( 'Building models.' );

				_.each( modelRoutes, function( modelRoute ) {

					var modelClassName,
						routeName  = wp.api.utils.extractRouteName( modelRoute.index ),
						parentName = wp.api.utils.extractParentName( modelRoute.index );

					// If the model has a parent in its route, add that to its class name;
					if ( '' !== parentName && parentName !== routeName ) {
						modelClassName = parentName.wpapiCapitalize() + routeName.wpapiCapitalize();
						wp.api.models[modelClassName] = wp.api.WPApiBaseModel.extend( {
							url: function() {
								return apiRoot + versionString +
									parentName +  '/' + this.get( 'parent' ) + '/' +
									routeName  +  '/' + this.get( 'id' );
							},
							route: modelRoute
						} );
					} else {
						modelClassName = routeName.wpapiCapitalize();
						wp.api.models[modelClassName] = wp.api.WPApiBaseModel.extend( {
							url: function() {
								return apiRoot + versionString + routeName +  '/' + this.get( 'id' );
							},
							route: modelRoute
						} );
					}
				} );

				wp.api.utils.log( 'Building collections.' );
				_.each( collectionRoutes, function( collectionRoute ) {

					var collectionClassName,
						routeName  = collectionRoute.index.slice( collectionRoute.index.lastIndexOf( '/' ) + 1 ),
						parentName = wp.api.utils.extractParentName( collectionRoute.index );

					// If the model has a parent in its route, add that to its class name;
					if ( '' !== parentName && parentName !== routeName ) {

						collectionClassName = parentName.wpapiCapitalize() + routeName.wpapiCapitalize();
						wp.api.collections[collectionClassName] = wp.api.WPApiBaseCollection.extend( {
							url: function() {
								return apiRoot + versionString +
								parentName + '/' + this.parent + '/' +
								routeName;
							},
							model: wp.api.models[collectionClassName],
							route: collectionRoute
						} );


					} else {
						collectionClassName = routeName.wpapiCapitalize();
						wp.api.collections[collectionClassName] = wp.api.WPApiBaseCollection.extend( {
							url:  apiRoot + versionString + routeName,
							route: collectionRoute
						} );
					}
				} );


			},
			error: function() {
				wp.api.utils.log( 'Schema load error.' );
			}
		} );

	};

	wp.api.init();

})( window );
