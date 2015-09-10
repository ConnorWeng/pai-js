var should = chai.should();

describe('pai.js', function() {
    var pai;
    beforeEach(function() {
        pai = new _pai('ASDFGHJKL');
    });

    describe('saveremote', function() {
        it('should remove items from local storage', function() {
            window.localStorage.setItem('_pai', '{"key": "value"}');
            pai.saveremote();
            should.not.exist(window.localStorage.getItem('_pai'));
        });
    });
});
