function SendData(url,data) { 
    $.ajax({
            type: "POST",
            url: url,
            data: data,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
    headers:  {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    },
            success: function (msg) {
                alertify.notify(msg.success, msg.status == 200 ? 'success' : 'error', 2, function () {});
            }
        });  
}

function ReadData(url,loadOptions)
{
    var deferred = $.Deferred(),
    args = {};

if (loadOptions.sort) {
    args.orderby = loadOptions.sort[0].selector;
    if (loadOptions.sort[0].desc)
        args.orderby += " desc";
}

args.skip = loadOptions.skip;
args.take = loadOptions.take;

$.ajax({
    url: url,
    dataType: "json", 
    data: args,
    success: function(result) {
        deferred.resolve(result.items, { totalCount: result.totalCount });
    },
    error: function() {
        deferred.reject("Data Loading Error");
    },
    timeout: 5000
});

return deferred.promise();  

}

function SendDataTable(url, data,key){ 
    var d = $.Deferred();
    $.ajax({
            type: "POST",
            url: key===null ? url: url+key,
            data: data,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            cache: false  
            }).done(function(result) {
               d.resolve(result);
            }).fail(function(xhr) {
               d.reject(xhr.responseJSON ? xhr.responseJSON.Message : xhr.statusText);
            });
    return d.promise();
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