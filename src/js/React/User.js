var User = React.createClass({
    click: function(e){
        console.log("test");
        this.props.name = "AAA";
    },
    componentWillMount: function(){
      console.log('test222');
    },
    render: function(){
        return <div onClick={this.click}><strong>!{this.props.name}!</strong></div>
    }
});