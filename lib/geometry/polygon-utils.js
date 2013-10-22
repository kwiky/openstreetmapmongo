/**
* Concatenate ways to form polygons.
*
* Stefan Wehner 2012
*/

exports.reduceMembers = reduce;
exports.removeAtIndex = removeAtIndex;
exports.same = same;

// returns true if p0 and p1 have the same coordinates
function same(p0, p1) {
    return (Math.abs(p0[0] - p1[0]) < 1e-9 && Math.abs(p0[1] - p1[1]) < 1e-9);
}

// returns a new array with the i-th element removed from a.
// Note: a will be changed in the process!
function removeAtIndex(a,ri) {
    if (ri < a.length) {
        for (var ix=ri; ix>0; ix--) {
            a[ix]=a[ix-1];
        }
        return a.slice(1);
    } else {
        return a;
    }
}


/**
* A relation (polygon) in openstreetmap is made from 1..n ways. This routine finds ways
* in the relations members which connect to each other.
*/

function reduce(mem) {
    var m0 = mem[0];
    // go over all members (ways) in mem
    for (var i=1; i<mem.length; i++) {
        var m1 = mem[i];
        // test if any of their endpoints are the same and reverse array if necessary
        if (same (m0[m0.length-1], m1[m1.length-1])) {
            m1.reverse();
        } else if (same (m0[0], m1[0])) {
            m0.reverse();
        } else if (same (m0[0], m1[m1.length-1])) {
            m0.reverse();
            m1.reverse();
        }
        // last node in m0 is the same as first node in m1
        if (same(m0[m0.length-1], m1[0])) {
            mem[0] = m0.concat(m1.splice(1));
            mem = removeAtIndex(mem,i);
            if (mem.length > 1) {
                mem = reduce(mem);
            }
            break;
        }
    }
    // no connecting member was found for m1. Try with the rest
    if (mem.length > 2) {
        var mx = reduce(mem.splice(1));
        return mem.concat(mx);
    }
    return mem;
}

