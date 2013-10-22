/*
* unit tests for math.js
*
* Stefan Wehner (2012)
*/
var Geomath = require('../lib').Geomath;
var Transform = require('../lib').Transform;

exports.distanceSamePoint = function(test) {
    var point = [0,0];

    test.equal(0, Geomath.pointDistance(point,point));
    test.done();
}

exports.geomath_helpers = {
    setUp: function(callback) {
        this.p0 = [0,0];
        this.p1 = [1,0];
        this.p2 = [2,0];
        this.p3 = [3,0];
        this.p4 = [4,0];
        callback();
    },
    forwardTriplet_oneCall: function(test) {
        test.expect(5);
        var context = this;
        function processor(p0,p1,p2,dev) {
            test.equal(p0,context.p0);
            test.equal(p1,context.p1);
            test.equal(p2,context.p2);
            test.equal(10,dev);
            return [p0,p1,p2];
        }
        var scarce = Geomath.TestInterface.processForwardInTriplets([this.p0,this.p1,this.p2,this.p3],10,processor);
        test.deepEqual([this.p0,this.p1,this.p2,this.p3],scarce);
        test.done();
    },
    forwardTriplet_twoCalls_two_drops: function(test) {
        test.expect(7);
        var counter = 0;
        var context = this;
        function processor(p0,p1,p2,dev) {
            counter++;
            if (counter == 1) {
                test.equal(p0,context.p0);
                test.equal(p1,context.p1);
                test.equal(p2,context.p2);
            } else if (counter == 2) {
                test.equal(p0,context.p2);
                test.equal(p1,context.p3);
                test.equal(p2,context.p4);
            } else {
                test.ok(false,"must not go here");
            }
            return [p0,p2];
        }
        var scarce = Geomath.TestInterface.processForwardInTriplets([this.p0,this.p1,this.p2,this.p3,this.p4],10,processor);
        test.deepEqual([this.p0,this.p2,this.p4],scarce);
        test.done();
    },
    backwardTriplet_oneCall: function(test) {
        test.expect(5);
        var context = this;
        function processor(p0,p1,p2,dev) {
            test.equal(p0,context.p1);
            test.equal(p1,context.p2);
            test.equal(p2,context.p3);
            test.equal(10,dev);
            return [p0,p1,p2];
        }
        var scarce = Geomath.TestInterface.processBackwardInTriplets([this.p0,this.p1,this.p2,this.p3],10,processor);
        test.deepEqual([this.p0,this.p1,this.p2,this.p3],scarce);
        test.done();
    },
    backwardTriplet_twoCalls_two_drops: function(test) {
        test.expect(7);
        var counter = 0;
        var context = this;
        function processor(p0,p1,p2,dev) {
            counter++;
            if (counter == 1) {
                test.equal(p0,context.p2);
                test.equal(p1,context.p3);
                test.equal(p2,context.p4);
            } else if (counter == 2) {
                test.equal(p0,context.p0);
                test.equal(p1,context.p1);
                test.equal(p2,context.p2);
            } else {
                test.ok(false,"must not go here");
            }
            return [p0,p2];
        }
        var scarce = Geomath.TestInterface.processBackwardInTriplets([this.p0,this.p1,this.p2,this.p3,this.p4],10,processor);
        test.deepEqual([this.p0,this.p2,this.p4],scarce);
        test.done();
    },
    minimal_deviation: function(test) {
        // along equator
        var scarce = Geomath.TestInterface.dropTheMiddleman(this.p0,this.p1,this.p2,0);
        test.deepEqual([this.p0,this.p1,this.p2],scarce,"no change for zero deviation")
        test.done();
    },
    keep_middle_point_because_distance: function(test) {
        // along equator
        var scarce = Geomath.TestInterface.dropTheMiddleman(this.p0,this.p1,this.p2,1);
        test.deepEqual([this.p0,this.p1,this.p2],scarce,"no change for large point distance")
        test.done();
    },
    cut_out_middlepoint: function(test) {
        // along equator
        var scarce = Geomath.TestInterface.dropTheMiddleman(this.p0,this.p1,this.p2,1000000000);
        test.deepEqual([this.p0,this.p2],scarce,"middle point must go")
        test.done();
    },
    circularWay: function(test) {
        var scarce = Geomath.TestInterface.dropTheMiddleman(this.p0,this.p1,this.p0,112000);
        test.deepEqual([this.p0,this.p0],scarce,"for circular way use distance p0 -> p1")
        test.done();
    }
}


exports.geomath = {
    setUp: function(callback) {
        this.p1 = [-71.6854,-36.8386];
        this.p2 = [-71.6469,-36.8998];
        this.p3 = [-71.5948,-36.8636];

        callback();
    },
    distanceTwoPoints: function(test) {
        test.ok(10 > Math.abs(8535 - Geomath.pointDistance(this.p1,this.p3)));
        test.done();
    },
    distanceTwoPointsCommutative: function(test) {
        test.equal(Geomath.pointDistance(this.p3,this.p1), Geomath.pointDistance(this.p1,this.p3));
        test.done();
    },
    wayLength_zero: function(test) {
        var coords = [[0,0],[0,0]];

        test.equal(0, Geomath.wayLength(coords));
        test.done();
    },
    wayLength_threeNodes: function(test) {
        test.ok(20 > Math.abs(13767 - Geomath.wayLength([this.p1,this.p2,this.p3])));
        test.done();
    },
    transform: function(test) {
        var transform = new Transform(this.p1);

        test.ok(10 > Math.abs(10074 - transform.getXY(this.p3)[0]));
        test.ok(10 > Math.abs(1924 - transform.getXY(this.p3)[1]));
        test.done();
    },
    way_already_scarce: function(test) {
        var way = [this.p1,this.p3];
        var scarce = Geomath.scarceWay(way,100);
        test.deepEqual(way,scarce,"no change for two-point-way")
        test.done();
    },
    shrink_to_single_point: function(test) {
        var way = [this.p1,this.p3];
        var scarce = Geomath.scarceWay(way,1000000000);
        test.equal(1,scarce.length,"shrink to single point")
        test.done();
    },
    scarceSchlangenweg: function(test) {
        var scsch = Geomath.scarceWay(Schlangenweg,300);
        test.deepEqual(Schlangenweg[0],scsch[0],"start points must be equal");
        test.deepEqual(Schlangenweg[Schlangenweg.length-1],scsch[scsch.length-1],"end points must be equal");
        test.equal(10,scsch.length,"this results in 10 segments for 300m devuation");
        // printWayOsm(scsch);
        test.done();
    }
}



function printWayOsm(nodes) {
    console.log("<?xml version='1.0' encoding='UTF-8'?>");
    console.log("<osm version='0.6' generator='JOSM'>");
    nodes.forEach(function (nd, i) {
        console.log(" <node id='"+(i+1)+"' visible='true' version='1' lat='"+nd[1]+"' lon='"+nd[0]+"' />");
    })
    console.log("<way id='5555' action='modify' visible='true' version='2'>");
    for (var i=1; i <= nodes.length; i++) {
        console.log("  <nd ref='"+i+"' />");
    }
    console.log(" </way>");
    console.log("</osm>");
}

var Schlangenweg = [
  [ -71.6762545263169, -36.86039047761389 ],
  [ -71.6728006745442, -36.86027288495994 ],
  [ -71.6703756296825, -36.859626122128866 ],
  [ -71.66927333656356, -36.85797979204183 ],
  [ -71.66846498827633, -36.85627462706472 ],
  [ -71.6681710434446, -36.855157429383766 ],
  [ -71.66611342962257, -36.854451822434896 ],
  [ -71.66434976063225, -36.85421661867112 ],
  [ -71.66317398130536, -36.854628224782765 ],
  [ -71.66207168818642, -36.855392630252574 ],
  [ -71.66133682610712, -36.85615702807782 ],
  [ -71.66118985369125, -36.85698021718644 ],
  [ -71.6612633398992, -36.85850897343745 ],
  [ -71.66118985369125, -36.85968491897605 ],
  [ -71.66096939506747, -36.86021408856512 ],
  [ -71.6610428812754, -36.860978438169425 ],
  [ -71.66074893644367, -36.861683984864825 ],
  [ -71.66038150540402, -36.86250711444298 ],
  [ -71.6597936157406, -36.86338902915185 ],
  [ -71.65847086399785, -36.86380058586603 ],
  [ -71.65744205708683, -36.86374179218543 ],
  [ -71.65648673638374, -36.86338902915185 ],
  [ -71.65575187430444, -36.86256590907356 ],
  [ -71.65420866393791, -36.86203675576972 ],
  [ -71.65244499494759, -36.861683984864825 ],
  [ -71.65119572941279, -36.8620955507622 ],
  [ -71.6500199500859, -36.86250711444298 ],
  [ -71.64913811559074, -36.86285988154794 ],
  [ -71.64796233626387, -36.862742292693895 ],
  [ -71.64693352935285, -36.862213140611466 ],
  [ -71.64663958452114, -36.8608608464202 ],
  [ -71.64671307072906, -36.86015529212507 ],
  [ -71.64700701556079, -36.858861758998934 ],
  [ -71.64935857421453, -36.85774459913432 ],
  [ -71.65046086733349, -36.857156613699104 ],
  [ -71.65119572941279, -36.85627462706472 ],
  [ -71.6517101328683, -36.855510230415575 ],
  [ -71.65251848115552, -36.85480462672354 ],
  [ -71.6514896742445, -36.85427541967991 ],
  [ -71.64965251904626, -36.85409901651783 ],
  [ -71.64810930867974, -36.8533933997985 ],
  [ -71.64686004314493, -36.85239376496281 ],
  [ -71.64663958452114, -36.851217707243535 ],
  [ -71.64516986036253, -36.85062967159906 ],
  [ -71.64392059482772, -36.851041297025134 ],
  [ -71.6423773844612, -36.85162932950337 ],
  [ -71.64105463271845, -36.8521585548664 ],
  [ -71.6399523395995, -36.85221735745835 ],
  [ -71.6389970188964, -36.85204094954679 ],
  [ -71.63760078094575, -36.851805738364796 ],
  [ -71.63598408437129, -36.85174693545621 ],
  [ -71.63414692917304, -36.851864541228146 ],
  [ -71.63150142568756, -36.8521585548664 ],
  [ -71.62900289461794, -36.85286418298446 ],
  [ -71.62709225321177, -36.85374620897237 ],
  [ -71.62540207042937, -36.85427541967991 ],
  [ -71.6230505117756, -36.854687025474924 ],
  [ -71.62209519107252, -36.85503982867796 ],
  [ -71.6193027151712, -36.856803820266684 ],
  [ -71.61658372547778, -36.85827378215842 ],
  [ -71.61224803920992, -36.86074325449005 ],
  [ -71.60857372881341, -36.862389525046076 ],
  [ -71.60614868395173, -36.863330235154585 ],
  [ -71.60181299768387, -36.863976966636386 ],
  [ -71.59490529413844, -36.86538799814209 ]
];

