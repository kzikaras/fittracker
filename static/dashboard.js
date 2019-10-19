set_error = (message) => {
    $('#errors').html('<h3>' + message + '</h3>');
    setTimeout(() => {
        $('#errors').html('');
    }, 6000);
}

// Validate update profile
$('#update_profile').click((e) => {
    console.log('clicked');
    e.preventDefault();
    $('form[action="/update_profile"] input[type="text"]').each(() => {
        console.log(this);
    })
});