collsize
=============

Regular MongoDB CLI commands to get data on collections are dull:

```
rs0:PRIMARY> db 
testX
rs0:PRIMARY> show collections
Xfoo
account
corn
foo
geo
myColl
qqq
test
ticks
rs0:PRIMARY> db.account.stats();
{
	"ns" : "testX.account",
	"size" : 72758890,
	"count" : 1000000,
	"avgObjSize" : 72,
	"storageSize" : 22904832,
	"capped" : false,
	"wiredTiger" : {
		"metadata" : {
			"formatVersion" : 1
		},
```

Even with some simple clever programming, it's still ... weak:

```
rs0:PRIMARY> db.getCollectionNames().forEach(function(name) { var q = db[name].stats(); print("name: " + name + "; " + "count: " + q["count"]); });
name: Xfoo; count: 0
name: account; count: 1000000
name: corn; count: 4
name: foo; count: 9
name: geo; count: 3
name: myColl; count: 1
name: qqq; count: 1
name: test; count: 4
name: ticks; count: 86400
```

But what you really want is something like this:
```
rs0:PRIMARY> db.collsize();
Collection            Count   AvgSize          Unz  Xz  +Idx     TotIdx  Idx/doc
--------------------  ------- -------- -G--M------  --- ---- ---M------  -------
             account  1000000      72     72758890  3.2    1   20770816   20
               ticks    86400      61      5270400  3.2    3    2957312   33
                 foo        9      27          246  0.0    0      16384    0
                corn        4      29          116  0.0    0      16384    0
                test        4      19           76  0.0    0      16384    0
                 geo        3     484         1453  0.0    1      32768    0
              myColl        1      76           76  0.0    0      16384    0
                 qqq        1      33           33  0.0    0      16384    0
               -----  ------- -------- -G--M------  --- ---- ---M------  -------
                   9  1086422             78031290             26079232
```

`collsize` extends the MongoDB CLI DB object prototype with a new method
`collsize` and formats it nicely.  By default, it is sorted by `count`.
You can change sort by supplying the name of the column header in any
case combination:

```
rs0:PRIMARY> db.collsize("uNz"); // mixed case does not matter
Collection            Count   AvgSize          Unz  Xz  +Idx     TotIdx  Idx/doc
--------------------  ------- -------- -G--M------  --- ---- ---M------  -------
             account  1000000      72     72758890  3.2    1   20770816   20
               ticks    86400      61      5270400  3.2    3    2957312   33
                 geo        3     484         1453  0.0    1      32768    0
                 foo        9      27          246  0.0    0      16384    0
                corn        4      29          116  0.0    0      16384    0
              myColl        1      76           76  0.0    0      16384    0
                test        4      19           76  0.0    0      16384    0
                 qqq        1      33           33  0.0    0      16384    0
               -----  ------- -------- -G--M------  --- ---- ---M------  -------
                   9  1086422             78031290             26079232
```


License
-------
Copyright (C) {2018} {Buzz Moschetti}

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.


Disclaimer
----------

This software is not supported by MongoDB, Inc. under any of their commercial support subscriptions or otherwise. 

