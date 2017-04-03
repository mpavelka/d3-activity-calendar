#!/usr/bin/env python3
import matplotlib.pyplot as plt
import matplotlib.cm

#See http://scipy-cookbook.readthedocs.io/items/Matplotlib_Show_colormaps.html

maps = sorted(m for m in plt.cm.datad if not m.endswith("_r"))
#print(maps)

cmap=plt.get_cmap('Blues')
#print(dir(cmap))

sm = matplotlib.cm.ScalarMappable(cmap=cmap)
#print(sm.to_rgba([0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9, 1.0], bytes = True))

COUNT=32

res = []
for r,g,b,a in sm.to_rgba([i / (COUNT-1) for i in range(0, COUNT)], bytes = True):
	res.append('"#{:02x}{:02x}{:02x}"'.format(r,g,b))

#res = reversed(res)

print(','.join(res))