set_error = (message, e) => {
    $('.errors').html('<h3>' + message + '</h3>');
    setTimeout(() => {
        $('.errors').html('');
    }, 4000);
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

$('#calcBmi').click(function() {
    console.log('clicked');
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        console.log(this.readyState);
        if (this.readyState == 4 && this.status == 200) {
            console.log('success');
        }
    }
    xhttp.open('GET', '/calc_bmi', true);
    xhttp.send();
});