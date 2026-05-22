
$(document).ready(function(){

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBmS9Qr2LAwcbIprXWw-wJr06Vp49P6j9o",
        authDomain: "pouzat-fr.firebaseapp.com",
        databaseURL: "https://pouzat-fr.firebaseio.com",
        storageBucket: "pouzat-fr.appspot.com",
        messagingSenderId: "916177954118"
    };

    firebase.initializeApp(config);

    //RECEPTION DUN MESSAGE
    firebase.database().ref("messages").on("child_added", function(dataSnapshot){

        var message = " <p>" + dataSnapshot.val() + "<p/>";

        $("#chat-container").append(message);

    });

    //ENVOI DUN MESSAGE
    $("#send-message").submit(function(event){

        event.preventDefault();

        var input = $("#message");

        firebase.database().ref("messages").push(input.val());

        input.val("");

    });

    $("#clear_chat").click(function(){

        firebase.database().ref("messages").set(null);

    });

    firebase.database().ref("messages").on("value", function(dataSnapshot){

        if(!dataSnapshot.exists()){


            $("#chat-container").html("");

        }

    });

});