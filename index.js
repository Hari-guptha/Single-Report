const express = require('express');
const app = express();
const axios = require('axios');
const config = require('./Config')

const apiUrl = config.apiUrl;
const authToken = config.authToken
const testFile = config.numberofUsecase
let currentTestIndex = 0;


const axiosInstance = axios.create({
    baseURL: apiUrl,
    headers: {
        Authorization: `Bearer ${authToken}`
    }
});

function loadTestCase() {
    if (currentTestIndex < testFile.length) {
        return require(`./TestCases/${testFile[currentTestIndex]}.json`);
    } else {
        return null;
    }
}

// Message comparison function
function messageCompare(actual, expected) {
    if (actual.type === "text") {
        actual = actual.val.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        expected = expected.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        // console.log("Actual:", actual + '\n');
        // console.log("Expected:", expected + '\n');
        const expectedWords = expected.split(' ');
        const foundAllWords = expectedWords.every(word => actual.includes(word));
        if (foundAllWords) {
            // console.log("-----Pass------" + '\n');
            return true;
        } else {
            console.log('\n' + "-----Fail------")
            console.log('\n' + "Actual:", actual + '\n');
            console.log("Expected:", expected + '\n');
            console.log("---------------" + '\n');
            return false;
        }
    } else if (actual.type === "form") {
        // console.log("Form" + '\n');
        // console.log("-----Pass------" + '\n');
        return true;
    }
}

// Main function to handle responses and messages
async function handleResponse(response, expectedMessages, counter) {
    const data = response.data.data;
    for (let i = 0; i < data.length; i++) {
        if (i < expectedMessages.length) {
            if (!messageCompare(data[i], expectedMessages[i].contains)) {
                console.log("Test case failed" + '\n');
                return;
            }
        } else {
            console.log("Flow Missing" + '\n');
            return;
        }
    }
    if (counter < testCases.testCases[0].messages.length) {
        const message = testCases.testCases[0].messages[counter].input;
        const output = testCases.testCases[0].messages[counter].output;
        await sendMessage(message, output, counter + 1);
    } else {
        console.log('Test case passed' + '\n');
    }
}

// Function to send a message
async function sendMessage(message, expected, counter) {
    const requestData = {
        session: {
            new: counter === 1
        },
        message: {
            type: 'text',
            val: message
        },
        from: {
            id: 'U12345',
            userInfo: {
                firstName: config.firstName,
                lastName: config.lastName,
                email: config.email
            }
        },
        mergeIdentity: true
    };
    try {
        const response = await axiosInstance.post('', requestData);
        await handleResponse(response, expected, counter);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function runTests() {
    testCases = loadTestCase();
    if (testCases) {
        console.log(`Running Test Case ${currentTestIndex + 1}`);
        const message = testCases.testCases[0].messages[0].input;
        output = testCases.testCases[0].messages[0].output;
        await sendMessage(message, output, 1);
        currentTestIndex++; // Move to the next test case
        runTests(); // Continue with the next test case
    } else {
        console.log('All test cases have been completed' + '\n');
        setTimeout(() => {
            currentTestIndex = 0;
            runTests();
        }, 120000);  // Run the loop after 2 minutes
    }
}

app.listen(4001, () => {
    console.log("Script running" + '\n');
    runTests();
});
