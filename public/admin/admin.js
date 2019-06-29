function SendData(url,data) { 
    $.ajax({
            type: "POST",
            url: url,
            data: data,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (msg) {
                alertify.notify(msg.success, msg.status == 200 ? 'success' : 'error', 2, function () {});
            }
        });  
}

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}

function Settings()
{
        document.title = '#NodeCms - Admin Panel - Settings';
    
        var myOptions = {
            "-1": "-1 Default compression level",
            "0": "0 No compression",
            "1": "1",
            "2": "2",
            "3": "3",
            "4": "4",
            "5": "5",
            "6": "6",
            "7": "7",
            "8": "8",
            "9": "9 Best compression",
        };
    
        var _select = $('<select>');
        $.each(myOptions, function (val, text) {
            _select.append($('<option></option>').val(val).html(text));
        });
    
        $("#compress").append(_select.html());
           
        $('#saveset').click(function () {
			SendData('Settings', JSON.stringify( {Appport:$('#Appport').val(), compress:$('#compress').val(),XPowerBy:$('#XPowerBy').val() }));
        });

}