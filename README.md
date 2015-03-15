#Toucan Tutoring API Docs

``` javascript
	// Domain name may change later. But for now, we'll stick
	// with this
	domain = "beta-toucanapp.rhcloud.com"
	baseurl = domain + "api/v1/"
```
####Globals Variables
The following are used throughout the application, and they follow the same
consistent format every time, whether they are request parameters or
response variables:

+ msg __(String - "SUCCESS" or "FAILURE")__
+ code __(Integer - 200 for "SUCCESS", 500 for "FAILURE")__
+ userId __(Integer -- identifier for the user -- store this locally
	during login/signup)__
+ tutorId __(Integer -- identifier for a selected tutor)__
+ latitude __(Double)__
+ longitude __(Double)__
+ course __(String)__
+ school __(String)__
+ userType __("TUTEE", "TUTOR", or "BOTH")__

__Assume everything asked for as a param is a string unless otherwise stated__

__Any param prefixed with "is" will be a Boolean. (Ex: isValid, isInSession)__

##Admin
__All endpoints here must look like this:__ _&lt;baseurl&gt;+/admin_

__Note:__ These endpoints are NOT for the Android app. These
will exclusively be for the admin team to add tutors and available
courses/schools.

###/addCourse
+ ####params
	+ latitude
	+ longitude
	+ course
	+ school


+ ####response
	+ msg
	+ code

###/generateTutorCode
+ ####params
	+ firstName
	+ lastName
	+ isCertified
	+ coursesTaught
	``` javascript
	// Example
	[course1, course2, course3]

	```
	+ rates
	``` javscript
	// Example
	{ "course1": rate1, "course2": rate2}

	```

+ ####response
	+ msg
	+ code
	+ tutorCode
	+ emailAddress


##Registration
__All endpoints here must look like this:__ _&lt;baseurl&gt;+/users_

###/checkCodeValid
+ ####params
	+ tutorCode


+ ####response
	+ msg
	+ code
	+ isValid

###/signupStudent
+ ####params
	+ firstName
	+ lastName
	+ username
	+ emailAddress
	+ password __(String)__
	+ phoneNumber __(String)__
	+ cardNumer __(String -- only the last 4 digits)__
	+ card_token
	``` javascript
		// Token given by Stripe during registration
		// Example:
		token = {
				id: "cus_038iviu9hff24f",
				// More here
		}
	```

+ ####response
	+ msg
	+ code
	+ userId
	+ isInSession
	+ userType

###/signupTutor
+ ####params
	+ firstName
	+ lastName
	+ username
	+ emailAddress
	+ password __(String)__
	+ phoneNumber __(String)__
	+ cardNumer __(String -- only the last 4 digits)__
	+ card_token
	``` javascript
		// Token given by Stripe during registration
		// Example:
		card_token = {
				id: "cus_038iviu9hff24f",
				// More here
		}
	```

	+ legal_name __(Full legal name of account holder)__
	+ accountNumber __(String -- only the last 4 digits)__
	+ bank_token
	``` javascript
		// Token given by Stripe during registration
		// Example:
		bank_token = {
				id: "rp_038iviu9hff24f",
				active_account : {
					id: "ba_foie32oidn2f",
				}
				// More here
		}
	```

+ ####response
	+ msg
	+ code
	+ userId
	+ isInSession
	+ isAvailable
	+ userType

###/login
+ ####params
	+ user __(Can be username or emailAddress)__
	+ password


+ ####response
	+ msg
	+ code
	+ userId
	+ isInSession
	+ isAvailable
	+ userType



##Sessions
__All endpoints here must look like this:__ _&lt;baseurl&gt;+/sessions/_


###/getCourses
+ ####params
	+ latitude
	+ longitude


+ ####response
	+ msg
	+ code
	+ coursesFound __(Boolean)__
	+ courseData
``` javascript
	// Example
	courseData = [
		{
		"coursename": "SPAN 1001",
		"school": "University of Georgia(UGA)"
		},
		{
		"coursename": "PSYC 2001",
		"school": "University of Georgia(UGA)"
		},
	];
```

###/activeTutor
+ ####params
  + latitude
  + longitude
  + userId
  + endTime __(time in milliseconds --> _long_)__

+ ####response
  + msg
  + code
  + beginTime
  + endTime
  + coursesTaught
``` javascript
// Example
coursesTaught = ["PORT 2001", "SPAN 1001"];
```
  + isAvailable
  + isInSession

###/inactiveTutor
+ ####params
	+ userId

+ ####response
	+ msg
	+ code
	+ beginTime
	+ endTime
	+ isAvailable
	+ isInSession

###/findActiveTutors
+ ####params
	+ latitude
	+ longitude
	+ course
	+ miles __\[OPTIONAL\] (Integer -> max distance to search by. Defaults to 3)__

+ ####response
	+ msg
	+ code
	+ foundTutors __(Boolean)__
	+ tutors
``` javascript
	// Example
	tutors = [
		{
			"name": "John Cena",
			"tutorId": 903778,
			"isCertified": true,
			"tutorPhone": "6783219900",
			"course": "PORT 2001",
			"rate": 8,
			"biography": "",
			"major": "",
			"year": "",
			"experience": 0,
			"reviews": [ ],
			"rating": 0,
			"latitude": 33.300933,
			"longitude": -83.794122,
		},
		// More results
	]
```

###/selectTutor
+ ####params
	+ tutorId
	+ userId
	+ course
	+ studentPhone __(String - phone number)__

+ ####response
	+ msg
	+ code
	+ tutorPhone __(String)__
	+ tutorName
	+ sessionId __(String)__
	+ course
	+ rate __(Float)__

###/tuteeBegin, /tutorBegin
__Note:__ These are two separate endpoints. They behave the exact same way
on the client-side.
+ ####params
	+ userId
	+ sessionId

+ ####response
	+ msg
	+ code
	+ hasBegun __(Boolean)__


###/tuteeEnd
+ ####params
	+ userId
	+ sessionId


+ ####response
	+ msg
	+ code
	+ amount __(Amount that will be charged on tutee's account)__

###/tuteeEnd
+ ####params
	+ userId
	+ sessionId


+ ####response
	+ msg
	+ code
	+ amount __(Amount that will be paid to the tutor's Bank Account)__


###/review
+ ####params
	+ userId
	+ sessionId
	+ rating __(Float - 1 - 5, increments of 0.5)__
	+ title __\[OPTIONAL\] (String - just the title of the review)__
	+ details __\[OPTIONAL\] (String - the actual review)__


+ ####response
	+ msg
	+ code
