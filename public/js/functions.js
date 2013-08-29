function centerElement(theElement, horizontalOnly, verticalOnly)
{
    //Get the window width and height
    var winWidth = $(window).width();
    var winHeight = $(window).height();
    
    //Get the horizontal center of the window
    var windowCenter = winWidth / 2;
    
    //Get the horizontal center of the element and work out the actual center
    var itemCenter = $(theElement).width() / 2;
    var theCenter = windowCenter - itemCenter;
    
    //Get the vertical center
    var windowMiddle = winHeight / 2;
    
    //Get the vertical center of the element and work out the actual center
    var itemMiddle = $(theElement).height() / 2;
    var theMiddle = windowMiddle-itemMiddle;

	if(!verticalOnly)
	{
		if(winWidth > $(theElement).width())
		{
			$(theElement).css('left', theCenter);
		}
		else
		{
			$(theElement).css('left','0');
		}
	}
    
	if(!horizontalOnly)
	{
		if(winHeight > $(theElement).height())
		{
			$(theElement).css('top', theMiddle);
			$(theElement).css('height', 'auto');
			$(theElement).css('max-height', '650px');
			$(theElement).css('overflow', 'hidden');
		}
		else
		{
			$(theElement).css('top','0');
			$(theElement).css('height', winHeight);
			$(theElement).css('overflow', 'auto');
		}
	}
}

//Resizes the normal and code message windows
function resizeWindows()
{
	$("#conversation").height(0);
	$("#code").height(0);
	
	var windowHeight = $(window).height();
	var topHeight = $("#top").outerHeight();
	var chatHeight = 30;
	
	var convPaddingTop = $("#conversation").css('padding-top');
	var convPaddingBottom = $("#conversation").css('padding-bottom');
	var convPaddingOffset = parseInt(convPaddingTop) + parseInt(convPaddingBottom);
	var convNewHeight = (windowHeight - (topHeight + chatHeight)) - convPaddingOffset;
	$("#conversation").height(convNewHeight);

	var codePaddingTop = $("#code").css('padding-top');
	var codePaddingBottom = $("#code").css('padding-bottom');
	var codePaddingOffset = parseInt(codePaddingTop) + parseInt(codePaddingBottom);
	var codeNewHeight = (windowHeight - (topHeight + chatHeight)) - codePaddingOffset;
	$("#code").height(codeNewHeight);
}

//When a new message is added to the window scroll to the bottom to always make it visible
function scrollChat(theElement)
{
	var elementHeight = $(theElement)[0].scrollHeight;
	$(theElement).scrollTop(elementHeight);
}

function showRoomUsers(e)
{
    $("#room-users").toggle();
    
    e.preventDefault();
}

function openSmileys(e)
{
    $("#smileys").toggle();
    
    e.preventDefault();
}

$(document).ready(function()
{
	resizeWindows();
});

$(window).resize(function() 
{
	resizeWindows();
	centerElement('#join-chat');
	centerElement('#invite');
});