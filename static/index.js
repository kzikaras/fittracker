
set_error = (message) => {
    $('#errors').html('<h3>' + message + '</h3>');
    setTimeout(() => {
        $('#errors').html('');
    }, 6000);
}
// Validate login form
$('#login').click((e) => {
    if (!$('#login_email').val().length || !$('#login_password').val().length) {
        e.preventDefault();
        set_error('Please complete the form.');
    }
});
// Validate sign up form
$('#signup').click((e) => {
    if (
        !$('#signup_email').val().length ||
        !$('#signup_username').val().length ||
        !$('#signup_password').val().length ||
        !$('#password_confirm').val().length
    ) {
        e.preventDefault();
        set_error('Please complete the form.');
        return
    }
    if ($('#signup_password').val().length < '5') {
        e.preventDefault();
        set_error('Password must be greater than 5 characters.');
        return;
    }
    if ($('#signup_password').val() !== $('#password_confirm').val()) {
        e.preventDefault();
        set_error('Passwords must match.');
    }
});
// Validate new workout form
$('#add_workout').click((e) => {
    console.log('click');
    if (
        !$('#workout_name').val().length ||
        !$('#workout_program').val().length
    ) {
        e.preventDefault();
        set_error('Please complete the form.');
    }
});