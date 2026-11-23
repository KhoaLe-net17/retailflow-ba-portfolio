-- Entirely synthetic fixture. Never contains real customer information.
INSERT INTO actors VALUES
('agent-1','AGENT'),('agent-2','AGENT'),('manager-1','MANAGER'),
('store-1','STORE'),('finance-1','FINANCE'),('provider-1','PROVIDER');
INSERT INTO orders VALUES
('O-100','2026-11-10T09:00:00+07','VND','PAID'),
('O-200','2026-11-20T09:00:00+07','VND','PAID'),
('O-OLD','2026-09-01T09:00:00+07','VND','PAID'),
('O-EDGE','2026-10-24T16:00:00+07','VND','PAID'),
('O-FUTURE','2026-11-24T09:00:00+07','VND','PAID');
INSERT INTO order_lines VALUES
('L-01','O-100','Cotton shirt','APPAREL',2,600000,100000,500000),
('L-02','O-200','Winter jacket','APPAREL',1,900000,0,900000),
('L-03','O-OLD','Canvas bag','ACCESSORY',1,150000,0,150000),
('L-04','O-EDGE','Rounding fixture','APPAREL',3,110000,9999,100001),
('L-05','O-200','Sealed care product','CONSUMABLE',1,80000,0,80000),
('L-06','O-FUTURE','Future delivery fixture','APPAREL',1,120000,0,120000);
INSERT INTO order_units VALUES
('U-01','L-01',1,250000),('U-02','L-01',2,250000),
('U-03','L-02',1,900000),('U-04','L-03',1,150000),
('U-05','L-04',1,33334),('U-06','L-04',2,33334),('U-07','L-04',3,33333),
('U-08','L-05',1,80000),('U-09','L-06',1,120000);
