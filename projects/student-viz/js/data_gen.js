
/**
 * Originally the data used for this visualization came from an external
 * source (somewhere in Valdivia, Chile) but the link rotted sometime in 
 * 2020. This script instantiates random data to replace it.
 */


function getRandomInt(max) {
	
	// returns a random integer i, such that 0 <= i < max
	
	return Math.floor(Math.random() * Math.floor(max)); }


function getRandomDate(start, end) {
	
	// returns a random date object between the start and end times
	
	let max = Date.parse(start);
	let min = Date.parse(end);
	
	return Math.floor(Math.random()*(max-min) + min);
}


function getRandomData(n) {
	
	// creates the student usage dataset
	
	let names = ["Agustín", "Benjamín", "Vicente", "Martín", "Matías", 
		"Mateo", "Pancho", "Tomás", "Alonso", "Maximiliano", "Cristóbal", 
		"José", "Lucas", "Sebastián", "Felipe", "Sofía", "Emilia", 
		"Isidora", "Florencia", "Maite", "Antonella", "Martina", 
		"Josefa", "Amanda", "Agustina", "Catalina", "Antonia", 
		"Isabella", "María", "Pamela"];

	var students = [];
	
	// generate an array of students
	
	for (var i = 0; i < names.length; i++) {
		
		var stu = { name: names[i],
					pretest: getRandomInt(2) + 1,
					grupo: getRandomInt(2) + 1};
		
		students.push(stu);

	}
	
	// generate usage data using students from above
	
	var data = [];
	
	for (var i = 0; i < n; i++) {
		
		var stu = students[getRandomInt(students.length-1)];
	
		var obj = { Time: getRandomDate('September 19, 2016 03:24:00', 'December 19, 2016 03:24:00'),
				topicorder: getRandomInt(14),
				Pretest: stu.pretest,
				usuario: stu.name,
				total_act: getRandomInt(170),
				grupo: stu.grupo };
	
		data.push(obj);
	
	}
	
	return data;
	
}

// cpoies the final dataset to local storage
localStorage.setItem("studentData", JSON.stringify(getRandomData(500)))
