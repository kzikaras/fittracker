set_error = (message, e) => {
    e.preventDefault();
    $('#errors').html('<h3>' + message + '</h3>');
    setTimeout(() => {
        $('#errors').html('');
    }, 6000);
}

// Validate update profile
$('#update_profile').click((e) => {
    console.log('clicked');
    if ($('input[name="email"]').val() === '')
        set_error('Please enter an email', e);
    if ($('input[name="username"]').val() === '')
        set_error('Please enter a username', e);
    if ($('input[name="password"]').val() === '')
        set_error('Please enter a password', e);
    if ($('input[name="passwordconfirm"]').val() === '')
        set_error('Please confirm your password', e);
    if ($('input[name="password"]').val() !== $('input[name="passwordconfirm"]').val())
        set_error('Passwords must match', e);
});