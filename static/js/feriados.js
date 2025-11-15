! function(global) {
  "use strict";
  
  moment.locale(navigator.language);
  Handlebars.registerHelper("dateFormat", (date, format) => moment(date).format(format));
  Handlebars.registerHelper("dateCalendar", (date, format) => moment(date).calendar({
    lastDay: "[Ontem]",
    sameDay: "[Hoje]",
    nextDay: "[Amanhã]",
    nextWeek: function(m) { return ((this.day() % 6) ? "[Próxima]" : "[Próximo]") + " dddd"; },
    lastWeek: function(m) { return ((this.day() % 6) ? "[Última]" : "[Último]") + " dddd"; },
    sameElse: function(m) { return "[" + this.from(m) + "]"; }
  }));
  
  $(global).on("load", function() {
    var cur_year;
    
    function done(response) {
      var el = $('<div class="row justify-content-center"></div>');
      var holidays = response.data;
      var TodayIsHoliday = todayIsHoliday(holidays);
      var NextHolidays = nextHolidays(holidays);
      var PreviousHolidays = previousHolidays(holidays);
      
      $('[data-holidays]').hide().html(`<div class="display-5 text-center fw-medium mb-3">Feriados ${cur_year}</div>`);
      
      TodayIsHoliday && $("[data-holidays]").append($('<div class="container-md"></div>').append(TodayIsHoliday));
      NextHolidays && el.append($('<div class="col-sm-6"></div>').append(NextHolidays));
      PreviousHolidays && el.append($('<div class="col-sm-6"></div>').append(PreviousHolidays));
      
      $("[data-holidays]").append($('<div class="container-md"></div>').append(el)).fadeIn();
    }
    
    function fail(response) {
      console.error(response);
      $("[data-holidays]").hide(0, function(evt) {
        $(this).html(`
          <div class="container-md">
            <div class="bg-black rounded border border-secondary p-3">
              <div class="fw text-center text-light fs-5">Something went wrong!</div>
            
              <div class="d-flex justify-content-center gap-2">
                <div><i class="bi bi-exclamation-circle-fill text-danger"></i></div>
                <div class="text-center"><code class="text-danger">${response.message}</code></div>
              </div>
            </div>
          </div>
        `).fadeIn();
      });
    }
    
    function template() {
      return `
      <div class="col-sm-6 mb-3">
			  <div class="card text-center">
				  <div class="card-header">
					  <h5 class="card-title text-danger m-0">{{holiday.name}}</h5>
				  </div>
				
				  <div class="card-body">
					  <h4 class="m-0">{{ dateFormat holiday.date "dddd, D [de] MMMM"}}</h4>
				  </div>
				
				  <div class="card-footer text-body-secondary">
					  <small class="fw-bolder text-secondary text-uppercase">{{dateCalendar holiday.date}}</small>
				  </div>
			  </div>
		  </div>
      `;
    }
    
    function todayIsHoliday() {
      var el = $('<div class="row justify-content-center align-items-center text-bg-danger py-3"></div>');
      var holidays = arguments[0].filter(holiday => moment(holiday.date).isSame(moment().format("YYYY-MM-DD")));
      
      holidays.forEach((holiday) => {
        el.append($(Handlebars.compile(template()).call(Handlebars, { holiday })).removeClass("col-sm-6 mb-3").addClass("col-md-6")) //.find(".card").addClass("border border-5 border-success");
      });
      
      if (holidays.length) return el;
    }
    
    function nextHolidays() {
      var el = $('<div class="row text-bg-info"></div>');
      var holidays = arguments[0].filter(holiday => moment(holiday.date).isAfter(moment().format("YYYY-MM-DD")));
      
      holidays.forEach((holiday) => {
        el.append($(Handlebars.compile(template()).call(Handlebars, { holiday }))) //.find(".card").addClass("border border-5 border-success");
      });
      
      if (holidays.length) {
        el.prepend('<div class="w-100"><h3 class="py-3 m-0">Próximos feriados</h3></div>');
        return el;
      }
    }
    
    function previousHolidays(holidays) {
      var el = $('<div class="row text-bg-warning"></div>');
      var holidays = arguments[0].filter(holiday => moment(holiday.date).isBefore(moment().format("YYYY-MM-DD"))).reverse();
      
      holidays.forEach((holiday) => {
        el.append($(Handlebars.compile(template()).call(Handlebars, { holiday }))) //.find(".card").addClass("border border-5 border-secondary");
      });
      
      if (holidays.length) {
        el.prepend('<div class="w-100"><h3 class="py-3 m-0">Feriados anteriores</h3></div>');
        return el;
      }
    }
    
    function feriadosBrasileiro() { axios({ url: `https://brasilapi.com.br/api/feriados/v1/${cur_year}` }).then(done).catch(fail); }
    
    $("[data-content]").append('<div class="container-md sticky-top text-bg-dark py-3"><div class="input-group input-group-lg"><label class="input-group-text" for="inputYear">Feriados</label><input name="year" type="tel" id="inputYear" class="form-control text-center" aria-label="ano" placeholder="ano"></div></div>');
    $("[data-content]").append($('<div data-holidays></div>'));
    $('input[name="year"]').val(moment().year()).on("input", function(evt) {
        this.value = this.value.replace(/\D+/g, "").slice(0, 4);
        
        if (this.value.length === 4) {
          if ((this.value > 1899) && (this.value < 2200)) {
            if (this.value !== cur_year) {
              cur_year = this.value;
              this.blur();
              $("[data-holidays]").hide(0, function(evt) {
                $(this).html('<div class="d-flex justify-content-center py-2"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>').fadeIn(function(evt) {
                  feriadosBrasileiro();
                })
              });
            }
          } else $.alert('<span class="text-danger me-2" aria-label="icon error"><i class="bi bi-exclamation-circle-fill"></i></span><em>O <strong>ANO</strong> deve ser a partir de <strong>1900</strong> a <strong>2199</strong>!</em>');
        }
      })
      
      .focus(function(evt) { this.select() })
      .trigger("input");
  });
}(this);