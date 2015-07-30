define(["utils/utils","mvc/upload/upload-model","mvc/upload/default/default-row","mvc/upload/upload-ftp","mvc/ui/ui-popover","mvc/ui/ui-select","mvc/ui/ui-misc","utils/uploadbox"],function(a,b,c,d,e,f,g){return Backbone.View.extend({select_extension:null,select_genome:null,uploadbox:null,upload_size:0,collection:new b.Collection,ftp:null,counter:{announce:0,success:0,error:0,running:0,reset:function(){this.announce=this.success=this.error=this.running=0}},initialize:function(a){this.app=a,this.options=a.options,this.list_extensions=a.list_extensions,this.list_genomes=a.list_genomes,this.ui_button=a.ui_button;var b=this;this.setElement(this._template()),this.btnLocal=new g.Button({title:"Choose local file",onclick:function(){b.uploadbox.select()}}),this.btnFtp=new g.Button({title:"Choose FTP file",onclick:function(){b._eventFtp()}}),this.btnCreate=new g.Button({title:"Paste/Fetch data",onclick:function(){b._eventCreate()}}),this.btnStart=new g.Button({title:"Start",onclick:function(){b._eventStart()}}),this.btnStop=new g.Button({title:"Pause",onclick:function(){b._eventStop()}}),this.btnReset=new g.Button({title:"Reset",onclick:function(){b._eventReset()}}),this.btnClose=new g.Button({title:"Close",onclick:function(){b.app.modal.hide()}});var c=[this.btnLocal,this.btnFtp,this.btnCreate,this.btnStart,this.btnStop,this.btnReset,this.btnClose];for(var d in c)this.$("#upload-buttons").prepend(c[d].$el);var b=this;this.uploadbox=this.$("#upload-box").uploadbox({initialize:function(a,c,d){return b._eventInitialize(a,c,d)},announce:function(a,c,d){b._eventAnnounce(a,c,d)},progress:function(a,c,d){b._eventProgress(a,c,d)},success:function(a,c,d){b._eventSuccess(a,c,d)},error:function(a,c,d){b._eventError(a,c,d)},complete:function(){b._eventComplete()}}),this.ftp=new e.View({title:"FTP files",container:this.btnFtp.$el}),this.select_extension=new f.View({css:"footer-selection",container:this.$("#footer-extension"),data:_.filter(this.list_extensions,function(a){return!a.composite_files}),value:this.options.default_extension,onchange:function(a){b.updateExtension(a)}}),b.$("#footer-extension-info").on("click",function(a){b.showExtensionInfo({$el:$(a.target),title:b.select_extension.text(),extension:b.select_extension.value(),placement:"top"})}).on("mousedown",function(a){a.preventDefault()}),this.select_genome=new f.View({css:"footer-selection",container:this.$("#footer-genome"),data:this.list_genomes,value:this.options.default_genome,onchange:function(a){b.updateGenome(a)}}),this._updateScreen(),this.collection.on("remove",function(a){b._eventRemove(a)})},_eventRemove:function(a){var b=a.get("status");"success"==b?this.counter.success--:"error"==b?this.counter.error--:this.counter.announce--,this._updateScreen(),this.uploadbox.remove(a.id)},_eventAnnounce:function(a,b){this.counter.announce++,this._updateScreen();var d=new c(this,{id:a,file_name:b.name,file_size:b.size,file_mode:b.mode,file_path:b.path});this.collection.add(d.model),this.$("#upload-table > tbody:first").append(d.$el),d.render()},_eventInitialize:function(a,b){var c=this.collection.get(a);c.set("status","running");var d=(c.get("file_name"),c.get("file_path")),e=c.get("file_mode"),f=c.get("extension"),g=c.get("genome"),h=c.get("url_paste"),i=c.get("space_to_tab"),j=c.get("to_posix_lines");return h||b.size>0?(this.uploadbox.configure({url:this.app.options.nginx_upload_path}),this.uploadbox.configure("local"==e?{paramname:"files_0|file_data"}:{paramname:null}),tool_input={},"new"==e&&(tool_input["files_0|url_paste"]=h),"ftp"==e&&(tool_input["files_0|ftp_files"]=d),tool_input.dbkey=g,tool_input.file_type=f,tool_input["files_0|type"]="upload_dataset",tool_input["files_0|space_to_tab"]=i&&"Yes"||null,tool_input["files_0|to_posix_lines"]=j&&"Yes"||null,data={},data.history_id=this.app.current_history,data.tool_id="upload1",data.inputs=JSON.stringify(tool_input),data):null},_eventProgress:function(a,b,c){var d=this.collection.get(a);d.set("percentage",c),this.ui_button.set("percentage",this._uploadPercentage(c,b.size))},_eventSuccess:function(a){var b=this.collection.get(a);b.set("percentage",100),b.set("status","success");var c=b.get("file_size");this.ui_button.set("percentage",this._uploadPercentage(100,c)),this.upload_completed+=100*c,this.counter.announce--,this.counter.success++,this._updateScreen(),Galaxy.currHistoryPanel.refreshContents()},_eventError:function(a,b,c){var d=this.collection.get(a);d.set("percentage",100),d.set("status","error"),d.set("info",c),this.ui_button.set("percentage",this._uploadPercentage(100,b.size)),this.ui_button.set("status","danger"),this.upload_completed+=100*b.size,this.counter.announce--,this.counter.error++,this._updateScreen()},_eventComplete:function(){this.collection.each(function(a){"queued"==a.get("status")&&a.set("status","init")}),this.counter.running=0,this._updateScreen()},showExtensionInfo:function(a){var b=this,c=a.$el,d=a.extension,f=a.title,g=_.findWhere(b.list_extensions,{id:d});this.extension_popup&&this.extension_popup.remove(),this.extension_popup=new e.View({placement:a.placement||"bottom",container:c,destroy:!0}),this.extension_popup.title(f),this.extension_popup.empty(),this.extension_popup.append(this._templateDescription(g)),this.extension_popup.show()},_eventFtp:function(){this.ftp.visible?this.ftp.hide():(this.ftp.empty(),this.ftp.append(new d(this).$el),this.ftp.show())},_eventCreate:function(){this.uploadbox.add([{name:"New File",size:0,mode:"new"}])},_eventStart:function(){if(!(0==this.counter.announce||this.counter.running>0)){var a=this;this.upload_size=0,this.upload_completed=0,this.collection.each(function(b){"init"==b.get("status")&&(b.set("status","queued"),a.upload_size+=b.get("file_size"))}),this.ui_button.set("percentage",0),this.ui_button.set("status","success"),this.counter.running=this.counter.announce,this._updateScreen(),this.uploadbox.start()}},_eventStop:function(){0!=this.counter.running&&(this.ui_button.set("status","info"),this.uploadbox.stop(),$("#upload-info").html("Queue will pause after completing the current file..."))},_eventReset:function(){0==this.counter.running&&(this.collection.reset(),this.counter.reset(),this._updateScreen(),this.uploadbox.reset(),this.select_extension.value(this.options.default_extension),this.select_genome.value(this.options.default_genome),this.ui_button.set("percentage",0))},updateExtension:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("extension")!=c.options.default_extension&&b||d.set("extension",a)})},updateGenome:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("genome")!=c.options.default_genome&&b||d.set("genome",a)})},_updateScreen:function(){message=0==this.counter.announce?this.uploadbox.compatible()?"You can Drag & Drop files into this box.":"Unfortunately, your browser does not support multiple file uploads or drag&drop.<br>Some supported browsers are: Firefox 4+, Chrome 7+, IE 10+, Opera 12+ or Safari 6+.":0==this.counter.running?"You added "+this.counter.announce+" file(s) to the queue. Add more files or click 'Start' to proceed.":"Please wait..."+this.counter.announce+" out of "+this.counter.running+" remaining.",this.$("#upload-info").html(message),0==this.counter.running&&this.counter.announce+this.counter.success+this.counter.error>0?this.btnReset.enable():this.btnReset.disable(),0==this.counter.running&&this.counter.announce>0?this.btnStart.enable():this.btnStart.disable(),this.counter.running>0?this.btnStop.enable():this.btnStop.disable(),0==this.counter.running?(this.btnLocal.enable(),this.btnFtp.enable(),this.btnCreate.enable()):(this.btnLocal.disable(),this.btnFtp.disable(),this.btnCreate.disable()),this.app.current_user&&this.options.ftp_upload_dir&&this.options.ftp_upload_site?this.btnFtp.$el.show():this.btnFtp.$el.hide(),this.counter.announce+this.counter.success+this.counter.error>0?this.$("#upload-table").show():this.$("#upload-table").hide()},_uploadPercentage:function(a,b){return(this.upload_completed+a*b)/this.upload_size},_templateDescription:function(a){if(a.description){var b=a.description;return a.description_url&&(b+='&nbsp;(<a href="'+a.description_url+'" target="_blank">read more</a>)'),b}return"There is no description available for this file extension."},_template:function(){return'<div class="upload-view-default"><div class="upload-top"><h6 id="upload-info" class="upload-info"/></div><div id="upload-box" class="upload-box"><table id="upload-table" class="table table-striped" style="display: none;"><thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Genome</th><th>Settings</th><th>Status</th><th/></tr></thead><tbody/></table></div><div id="upload-footer" class="upload-footer"><span class="footer-title">Type (set all):</span><span id="footer-extension"/><span id="footer-extension-info" class="upload-icon-button fa fa-search"/> <span class="footer-title">Genome (set all):</span><span id="footer-genome"/></div><div id="upload-buttons" class="upload-buttons"/></div>'}})});
//# sourceMappingURL=../../../../maps/mvc/upload/default/default-view.js.map