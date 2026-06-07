//config hold all of the env variable that app needs, we load them from .env file in development and set them as real env variables instead //

package config

type Config struct {
	DBHOST     string //HOST IP ADDRESS //
	DBPORT     string //ON WHICH PORT ARE WE HOSTING IT//
	DBUSER     string //NAME OF DATABSE USER//
	DBPASSWORD string //PASSWORD OF DB//
	DBNAME     string //NAME OF DB//
}
