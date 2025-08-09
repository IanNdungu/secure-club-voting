
import React, { useState } from 'react';
import { useElections } from '@/contexts/ElectionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Key, UserPlus } from 'lucide-react';
import { VoterCode } from '@/types';
import { format } from 'date-fns';

interface VoterCodeGeneratorProps {
  electionId: string;
}

const VoterCodeGenerator: React.FC<VoterCodeGeneratorProps> = ({ electionId }) => {
  const { generateVoterCodes, getVoterCodesByElection } = useElections();
  const [count, setCount] = useState<number>(10);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  const voterCodes = getVoterCodesByElection(electionId);
  
  const handleGenerateCodes = () => {
    const codes = generateVoterCodes(electionId, count);
    setGeneratedCodes(codes);
  };
  
  const exportCodesAsCsv = () => {
    const codes = getVoterCodesByElection(electionId);
    const csvContent = [
      ['Code', 'Created At', 'Status', 'Used At'].join(','),
      ...codes.map(code => [
        code.code,
        format(new Date(code.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        code.isUsed ? 'Used' : 'Available',
        code.usedAt ? format(new Date(code.usedAt), 'yyyy-MM-dd HH:mm:ss') : ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `voter-codes-election-${electionId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Voter Codes</CardTitle>
          <CardDescription>
            Create unique voter codes that can be distributed to eligible voters for this election.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="code-count">Number of Codes</Label>
              <Input 
                id="code-count"
                type="number"
                min="1"
                max="1000"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
              />
            </div>
            <Button onClick={handleGenerateCodes} className="mb-0.5">
              <UserPlus className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
          
          {generatedCodes.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">Generated Codes</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {generatedCodes.map((code) => (
                  <div key={code} className="p-2 bg-white border rounded-md text-center">
                    <code className="text-sm font-mono">{code}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These codes can be distributed to voters and used to authenticate for this election.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Voter Code Management</CardTitle>
          <CardDescription>
            View and manage all voter codes for this election.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm font-medium">Total Codes:</span> {voterCodes.length}
              <span className="mx-4 text-sm font-medium">Available:</span> 
              {voterCodes.filter(code => !code.isUsed).length}
              <span className="mx-4 text-sm font-medium">Used:</span> 
              {voterCodes.filter(code => code.isUsed).length}
            </div>
            <Button variant="outline" size="sm" onClick={exportCodesAsCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voterCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No voter codes have been generated yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  voterCodes.map((code) => (
                    <TableRow key={code.code}>
                      <TableCell className="font-mono">
                        <div className="flex items-center">
                          <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                          {code.code}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(code.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        {code.isUsed ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            Used
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.usedAt ? format(new Date(code.usedAt), 'yyyy-MM-dd HH:mm') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoterCodeGenerator;
