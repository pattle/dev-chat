# DevChat - A node.js chat app for developers

## Installation
Start by creating a database.  You can call it anything but I recommend "devchat".  Import the create_database.sql file

`mysql -uuser -ppassword -D devchat < create_database.sql`

After importing the database add your connection details to dev-chat.js.  If you running Windows make sure that the mysql service is running.  

To launch the app perform the following on the command line

`node dev-chat.js`

Navigate to localhost:5000 in your browser.  

## Attributions
In building this software I have used some icons by Yusuke Kamiyamane.  They are awesome!